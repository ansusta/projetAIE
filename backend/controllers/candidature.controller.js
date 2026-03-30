const Candidature  = require('../models/Candidature')
const OffreTravail = require('../models/OffreTravail')
const { createNotification } = require('../utils/notification')

// POST /api/candidatures
const soumettreCandidature = async (req, res) => {
  try {
    const { idOffre } = req.body

    const offre = await OffreTravail.findById(idOffre)
    if (!offre)                          return res.status(404).json({ error: 'Offer not found' })
    if (offre.statutOffre !== 'ouvert')  return res.status(400).json({ error: 'Offer is closed' })

    const existing = await Candidature.findOne({ idCandidat: req.user._id, idOffre })
    if (existing) return res.status(400).json({ error: 'Already applied to this offer' })

    const candidature = await Candidature.create({
      idCandidat: req.user._id,
      idOffre
    })

    // notify the recruteur
    await createNotification({
      idUtilisateur: offre.idRecruteur,
      contenu:        `Nouvelle candidature reçue pour l'offre "${offre.titre}"`,
      idCandidature:  candidature._id
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
      .populate('idOffre', 'titre localisation typeContrat idRecruteur')
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
      Embauchee:            'Félicitations ! Votre candidature a été acceptée.',
      refusee:              'Votre candidature n\'a pas été retenue.'
    }
    if (messages[etatCandidature]) {
      await createNotification({
        idUtilisateur: candidature.idCandidat,
        contenu:        messages[etatCandidature],
        idCandidature:  candidature._id
      })
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

    candidature.entretien        = { dateEntretien, statut, feedbackRecruteur }
    candidature.etatCandidature  = 'convocationEntretien'
    await candidature.save()

    await createNotification({
      idUtilisateur: candidature.idCandidat,
      contenu:        `Entretien planifié le ${new Date(dateEntretien).toLocaleDateString('fr-FR')}.`,
      idCandidature:  candidature._id
    })

    res.json(candidature)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  soumettreCandidature, mesCandidatures, candidaturesParOffre,
  getCandidature, mettreAJourStatut, planifierEntretien
}