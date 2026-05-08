const Candidature  = require('../models/candidature')
const OffreTravail = require('../models/offreTravail')
const Utilisateur  = require('../models/utilisateur')
const { createNotification }      = require('../utils/notification')
const Match                       = require('../models/match')
const { verifierFiltrePersonnel } = require('../utils/filtrePersonnel')

// POST /api/candidatures
const soumettreCandidature = async (req, res) => {
  try {
    const { idOffre } = req.body

    const [offre, candidat] = await Promise.all([
      OffreTravail.findById(idOffre),
      Utilisateur.findById(req.user._id)
    ])

    if (!offre)                         return res.status(404).json({ error: 'Offer not found' })
    if (offre.statutOffre !== 'ouvert') return res.status(400).json({ error: 'Offer is closed' })

    const existing = await Candidature.findOne({ idCandidat: req.user._id, idOffre })
    if (existing) return res.status(400).json({ error: 'Already applied to this offer' })

    const filtreResult = verifierFiltrePersonnel(candidat, offre)
    if (!filtreResult.passe) {
      return res.status(403).json({ error: filtreResult.raison, filtreEchoue: true })
    }

    const candidature = await Candidature.create({
      idCandidat: req.user._id,
      idOffre
    })

    await createNotification({
      idUtilisateur: offre.idRecruteur,
      contenu:       `Nouvelle candidature reçue pour l'offre "${offre.titre}"`,
      idCandidature: candidature._id,
      idOffre:       offre._id,
      type:          'candidature'
    })

    res.status(201).json(candidature)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/candidatures/mes-candidatures
const mesCandidatures = async (req, res) => {
  try {
    const candidatures = await Candidature.find({ idCandidat: req.user._id })
      .populate({
        path:   'idOffre',
        // ✅ Inclure statutOffre pour détecter les offres pourvues côté frontend
        select: 'titre localisation typeContrat idRecruteur statutOffre salaireMin description requis',
        populate: {
          path:   'idRecruteur',
          select: '_id nomEntreprise secteurActivite'
        }
      })
      .sort({ dateCandidature: -1 })

    res.json(candidatures)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/candidatures/offre/:offreId  — recruteur sees all applicants
const candidaturesParOffre = async (req, res) => {
  try {
    const offre = await OffreTravail.findById(req.params.offreId)
    if (!offre) return res.status(404).json({ error: 'Offer not found' })
    if (offre.idRecruteur.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not your offer' })

    const candidatures = await Candidature.find({ idOffre: req.params.offreId })
      .populate('idCandidat', 'nom prenom email telephone')
      .populate('idDocSup')
      .sort({ dateCandidature: -1 })

    res.json(candidatures)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/candidatures/:id
const getCandidature = async (req, res) => {
  try {
    const candidature = await Candidature.findById(req.params.id)
      .populate('idCandidat', 'nom prenom email telephone bio')
      .populate('idOffre')
      .populate('idDocSup')
    if (!candidature) return res.status(404).json({ error: 'Application not found' })

    const offre       = candidature.idOffre
    const isCandidat  = candidature.idCandidat._id.toString() === req.user._id.toString()
    const isRecruteur = offre.idRecruteur.toString()           === req.user._id.toString()

    if (!isCandidat && !isRecruteur && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' })

    res.json(candidature)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ✅ Notifie tous les candidats non retenus quand un poste est pourvu
const notifierPostePourvu = async (offreId, candidatEmbaucheId, offreTitre) => {
  try {
    // Toutes les candidatures pour cette offre sauf le candidat embauché
    const autresCandidatures = await Candidature.find({
      idOffre:    offreId,
      idCandidat: { $ne: candidatEmbaucheId },
      etatCandidature: { $nin: ['refusee'] }
    })

    const notifications = autresCandidatures.map(c => ({
      idUtilisateur: c.idCandidat,
      contenu:       `Le poste "${offreTitre}" a été pourvu par un autre candidat.`,
      idCandidature: c._id,
      idOffre:       offreId,
      type:          'postePourvu'
    }))

    if (notifications.length > 0) {
      // createNotification une par une pour respecter l'utilitaire existant
      await Promise.all(notifications.map(n => createNotification(n)))
    }
  } catch (err) {
    console.error('Erreur notification poste pourvu:', err.message)
  }
}

// PATCH /api/candidatures/:id/statut
const mettreAJourStatut = async (req, res) => {
  try {
    const { etatCandidature } = req.body
    const valid = ['Recue', 'demandeDocSupp', 'convocationEntretien', 'Embauchee', 'refusee']
    if (!valid.includes(etatCandidature))
      return res.status(400).json({ error: 'Invalid status' })

    const candidature = await Candidature.findById(req.params.id).populate('idOffre')
    if (!candidature) return res.status(404).json({ error: 'Application not found' })
    if (candidature.idOffre.idRecruteur.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not your offer' })

    candidature.etatCandidature = etatCandidature
    await candidature.save()

    const messages = {
      demandeDocSupp:       'Des documents supplémentaires ont été demandés pour votre candidature.',
      convocationEntretien: 'Vous avez été convoqué(e) à un entretien.',
      Embauchee:            `Félicitations ! Votre candidature pour "${candidature.idOffre.titre}" a été acceptée.`,
      refusee:              `Votre candidature pour "${candidature.idOffre.titre}" n'a pas été retenue.`
    }

    const types = {
      demandeDocSupp:       'candidature',
      convocationEntretien: 'entretien',
      Embauchee:            'embauche',
      refusee:              'refus'
    }

    if (messages[etatCandidature]) {
      await createNotification({
        idUtilisateur: candidature.idCandidat,
        contenu:       messages[etatCandidature],
        idCandidature: candidature._id,
        idOffre:       candidature.idOffre._id,
        type:          types[etatCandidature]
      })
    }

    // ✅ Si embauche : fermer l'offre + notifier tous les autres candidats
    if (etatCandidature === 'Embauchee') {
      await OffreTravail.findByIdAndUpdate(candidature.idOffre._id, { statutOffre: 'fermer' })
      await notifierPostePourvu(
        candidature.idOffre._id,
        candidature.idCandidat,
        candidature.idOffre.titre
      )
    }

    res.json(candidature)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/candidatures/:id/entretien
const planifierEntretien = async (req, res) => {
  try {
    const { dateEntretien, statut, feedbackRecruteur } = req.body
    if (!dateEntretien) return res.status(400).json({ error: 'dateEntretien is required' })

    const candidature = await Candidature.findById(req.params.id).populate('idOffre')
    if (!candidature) return res.status(404).json({ error: 'Application not found' })
    if (candidature.idOffre.idRecruteur.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not your offer' })

    candidature.entretien       = { dateEntretien, statut, feedbackRecruteur }
    candidature.etatCandidature = 'convocationEntretien'
    await candidature.save()

    await createNotification({
      idUtilisateur: candidature.idCandidat,
      contenu:       `Entretien planifié le ${new Date(dateEntretien).toLocaleDateString('fr-FR')} pour "${candidature.idOffre.titre}".`,
      idCandidature: candidature._id,
      idOffre:       candidature.idOffre._id,
      type:          'entretien'
    })

    res.json(candidature)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/candidatures/recruteur/grouped
const getCandidaturesGrouped = async (req, res) => {
  try {
    const offres   = await OffreTravail.find({ idRecruteur: req.user._id }).select('_id')
    const offreIds = offres.map(o => o._id)

    const candidatures = await Candidature.find({ idOffre: { $in: offreIds } })
      .populate('idCandidat', 'nom prenom email telephone photoProfil')
      .populate('idOffre',    'titre')
      .sort({ dateCandidature: -1 })

    const withScores = await Promise.all(
      candidatures.map(async (c) => {
        const match = await Match.findOne({
          idCandidat: c.idCandidat._id,
          idOffre:    c.idOffre._id
        })
        return {
          ...c.toObject(),
          matchScore:      match ? Math.round(match.score * 100) : null,
          typePostulation: match ? 'matching' : 'manuelle'
        }
      })
    )

    res.json({
      matching: withScores.filter(c => c.typePostulation === 'matching')
                          .sort((a, b) => b.matchScore - a.matchScore),
      manuelle: withScores.filter(c => c.typePostulation === 'manuelle')
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/candidatures/entretiens
const getEntretiens = async (req, res) => {
  try {
    const offres   = await OffreTravail.find({ idRecruteur: req.user._id }).select('_id titre')
    const offreIds = offres.map(o => o._id)

    const candidatures = await Candidature.find({
      idOffre:                   { $in: offreIds },
      etatCandidature:           'convocationEntretien',
      'entretien.dateEntretien': { $exists: true }
    })
      .populate('idCandidat', 'nom prenom email telephone')
      .populate('idOffre',    'titre')
      .sort({ 'entretien.dateEntretien': 1 })

    res.json(candidatures)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  soumettreCandidature, mesCandidatures, candidaturesParOffre,
  getCandidature, mettreAJourStatut, planifierEntretien,
  getEntretiens, getCandidaturesGrouped
}