const Utilisateur  = require('../models/utilisateur')
const Document     = require('../models/document')
const { createNotification } = require('../utils/notification')
const Candidature  = require('../models/candidature')
const OffreTravail = require('../models/offreTravail')
const Match        = require('../models/match')
const Commentaire = require('../models/commentaire')
const { verifyDocument } = require('../services/verification.service')

// ── GET /api/admin/users ──────────────────────────────────────────────────────
const listerUtilisateurs = async (req, res) => {
  try {
    const { role, statusCompte, etatValidation, page = 1, limit = 20 } = req.query
    const filter = {}
    if (role)           filter.role           = role
    if (statusCompte)   filter.statusCompte   = statusCompte
    if (etatValidation) filter.etatValidation = etatValidation

    const total = await Utilisateur.countDocuments(filter)
    const users = await Utilisateur.find(filter)
      .select('-motDePasse')
      .sort({ dateCreation: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── GET /api/admin/users/recruteurs/en-attente ────────────────────────────────
// FIX: Also include 'refuse' recruiters who have re-uploaded docs (demandeResoumise flag)
const recruteursEnAttente = async (req, res) => {
  try {
    const users = await Utilisateur.find({
      role: 'recruteur',
      $or: [
        { etatValidation: { $in: ['enAttente', 'valideParIA'] } },
        { etatValidation: 'refuse', demandeResoumise: true },
      ],
    })
      .select('-motDePasse')
      .sort({ dateCreation: -1 })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── GET /api/admin/users/:id ──────────────────────────────────────────────────
const getUtilisateur = async (req, res) => {
  try {
    const user = await Utilisateur.findById(req.params.id).select('-motDePasse')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── GET /api/admin/recruteurs/:id/dossier ─────────────────────────────────────
const getRecruteurDossier = async (req, res) => {
  try {
    const recruteur = await Utilisateur.findById(req.params.id).select('-motDePasse')
    if (!recruteur || recruteur.role !== 'recruteur')
      return res.status(404).json({ error: 'Recruiter not found' })

    const documents = await Document.find({
      idRecruteur: recruteur._id,
      type:        'docrecruteur',
    }).sort({ dateUpload: -1 })

    const aiSummary = {
      total:             documents.length,
      approuves:         documents.filter(d => d.aiVerification?.verdict === 'approuve').length,
      rejetes:           documents.filter(d => d.aiVerification?.verdict === 'rejete').length,
      enAttente:         documents.filter(d => !d.aiVerification).length,
      necessiteRevision: documents.filter(d => d.aiVerification?.verdict === 'necessiteRevision').length,
    }

    res.json({ recruteur, documents, aiSummary })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── PATCH /api/admin/users/:id/validate ──────────────────────────────────────
// FIX: Clear demandeResoumise flag when admin makes a final decision
const validerRecruteur = async (req, res) => {
  try {
    const { decision, motif } = req.body
    if (!['valideParAdmin', 'refuse'].includes(decision))
      return res.status(400).json({ error: "decision must be 'valideParAdmin' or 'refuse'" })

    const user = await Utilisateur.findById(req.params.id)
    if (!user)                     return res.status(404).json({ error: 'User not found' })
    if (user.role !== 'recruteur') return res.status(400).json({ error: 'Not a recruiter' })

    user.etatValidation  = decision
    user.motifRefus      = decision === 'refuse' ? (motif || null) : null
    user.demandeResoumise = false   // clear the re-apply flag after admin decision
    await user.save()

    if (decision === 'valideParAdmin') {
      await Document.updateMany(
        { idRecruteur: user._id, type: 'docrecruteur' },
        { estVerifie: true, dateVerifie: new Date() }
      )
    }

    const notifMsg = decision === 'valideParAdmin'
      ? '✅ Votre compte recruteur a été validé par notre équipe. Vous pouvez maintenant publier des offres d\'emploi.'
      : `❌ Votre compte recruteur a été refusé par notre équipe.${motif ? ' Motif : ' + motif : ''} Si vous pensez qu\'il s\'agit d\'une erreur, contactez le support.`

    await createNotification({ idUtilisateur: user._id, contenu: notifMsg })

    res.json({
      message:       `Recruiter ${decision === 'valideParAdmin' ? 'validated' : 'rejected'}`,
      etatValidation: decision,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── POST /api/admin/documents/:docId/re-verify ────────────────────────────────
const reVerifyDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.docId)
    if (!doc)
      return res.status(404).json({ error: 'Document not found' })
    if (doc.verificationEnCours)
      return res.status(409).json({ error: 'Verification already in progress' })

    verifyDocument(doc._id.toString()).catch(err =>
      console.error('[Re-verify] Error:', err.message)
    )

    res.json({ message: 'Re-verification started.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── PATCH /api/admin/users/:id/suspend ───────────────────────────────────────
const toggleSuspension = async (req, res) => {
  try {
    const user = await Utilisateur.findById(req.params.id)
    if (!user)               return res.status(404).json({ error: 'User not found' })
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot suspend an admin' })

    user.statusCompte = user.statusCompte === 'bloque' ? 'actif' : 'bloque'
    await user.save()

    res.json({
      message:      `Account ${user.statusCompte === 'bloque' ? 'suspended' : 'reactivated'}`,
      statusCompte: user.statusCompte,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── DELETE /api/admin/users/:id ───────────────────────────────────────────────
const supprimerUtilisateur = async (req, res) => {
  try {
    const user = await Utilisateur.findById(req.params.id)
    if (!user)               return res.status(404).json({ error: 'User not found' })
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot delete an admin' })

    await user.deleteOne()
    res.json({ message: 'User deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── GET /api/admin/candidatures ───────────────────────────────────────────────
const toutesLesCandidatures = async (req, res) => {
  try {
    const { etatCandidature, page = 1, limit = 20 } = req.query
    const filter = {}
    if (etatCandidature) filter.etatCandidature = etatCandidature

    const total = await Candidature.countDocuments(filter)
    const candidatures = await Candidature.find(filter)
      .populate('idCandidat', 'nom prenom email')
      .populate('idOffre',    'titre idRecruteur')
      .sort({ dateCandidature: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.json({ candidatures, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const getDashboardStats = async (req, res) => {
  try {
    const now   = new Date()
    const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000)
    const day7  = new Date(now - 7  * 24 * 60 * 60 * 1000)

    const [
      totalCandidats, totalRecruteurs, comptesBloques,
      recruteursEnAttenteCount, recruteursValideParIA, newUsersLast30d,
    ] = await Promise.all([
      Utilisateur.countDocuments({ role: 'candidat' }),
      Utilisateur.countDocuments({ role: 'recruteur' }),
      Utilisateur.countDocuments({ statusCompte: 'bloque' }),
      Utilisateur.countDocuments({ role: 'recruteur', etatValidation: 'enAttente' }),
      Utilisateur.countDocuments({ role: 'recruteur', etatValidation: 'valideParIA' }),
      Utilisateur.countDocuments({ dateCreation: { $gte: day30 } }),
    ])

    const [totalOffres, offresOuvertes, offresFermees, newOffresLast30d] = await Promise.all([
      OffreTravail.countDocuments(),
      OffreTravail.countDocuments({ statutOffre: 'ouvert' }),
      OffreTravail.countDocuments({ statutOffre: 'fermer' }),
      OffreTravail.countDocuments({ datePublication: { $gte: day30 } }),
    ])

    const [totalCandidatures, candidaturesLast7d, candidaturesParStatut] = await Promise.all([
      Candidature.countDocuments(),
      Candidature.countDocuments({ dateCandidature: { $gte: day7 } }),
      Candidature.aggregate([{ $group: { _id: '$etatCandidature', count: { $sum: 1 } } }]),
    ])

    const aiDocStats = await Document.aggregate([
      { $match: { type: 'docrecruteur' } },
      { $group: { _id: '$aiVerification.verdict', count: { $sum: 1 } } },
    ])
    const aiVerifSummary = { approuves: 0, rejetes: 0, necessiteRevision: 0, nonVerifies: 0 }
    for (const s of aiDocStats) {
      if      (s._id === 'approuve')          aiVerifSummary.approuves          += s.count
      else if (s._id === 'rejete')            aiVerifSummary.rejetes            += s.count
      else if (s._id === 'necessiteRevision') aiVerifSummary.necessiteRevision  += s.count
      else                                    aiVerifSummary.nonVerifies        += s.count
    }

    const offresPopulaires = await Candidature.aggregate([
      { $match: { dateCandidature: { $gte: day30 } } },
      { $group: { _id: '$idOffre', total: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'offretravails', localField: '_id', foreignField: '_id', as: 'offre' } },
      { $unwind: '$offre' },
      { $project: { _id: 0, offreId: '$_id', titre: '$offre.titre', localisation: '$offre.localisation', typeContrat: '$offre.typeContrat', totalCandidatures: '$total' } },
    ])

    const offresLesPlusMatchées = await Match.aggregate([
      { $group: { _id: '$idOffre', avgScore: { $avg: '$score' }, totalMatchs: { $sum: 1 } } },
      { $sort: { avgScore: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'offretravails', localField: '_id', foreignField: '_id', as: 'offre' } },
      { $unwind: '$offre' },
      { $project: { _id: 0, offreId: '$_id', titre: '$offre.titre', avgScore: { $round: [{ $multiply: ['$avgScore', 100] }, 1] }, totalMatchs: 1 } },
    ])

    const recruteursAvecEmbauche = await Candidature.aggregate([
      { $lookup: { from: 'offretravails', localField: 'idOffre', foreignField: '_id', as: 'offre' } },
      { $unwind: '$offre' },
      { $group: { _id: '$offre.idRecruteur', totalCandidatures: { $sum: 1 }, embauchees: { $sum: { $cond: [{ $eq: ['$etatCandidature', 'Embauchee'] }, 1, 0] } } } },
      { $match: { totalCandidatures: { $gt: 0 } } },
      { $addFields: { ratioEmbauche: { $divide: ['$embauchees', '$totalCandidatures'] } } },
      { $sort: { ratioEmbauche: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'utilisateurs', localField: '_id', foreignField: '_id', as: 'recruteur' } },
      { $unwind: '$recruteur' },
      { $project: { _id: 0, recruteurId: '$_id', nomEntreprise: '$recruteur.nomEntreprise', email: '$recruteur.email', totalCandidatures: 1, embauchees: 1, ratioEmbauche: { $round: [{ $multiply: ['$ratioEmbauche', 100] }, 1] } } },
    ])

    const candidatEngagement = await Candidature.aggregate([
      { $group: { _id: '$idCandidat', totalApplications: { $sum: 1 } } },
    ])
    const totalCandidatsActifs = candidatEngagement.length
    const moyCandidaturesParCandidat = totalCandidatsActifs > 0
      ? +(candidatEngagement.reduce((sum, c) => sum + c.totalApplications, 0) / totalCandidatsActifs).toFixed(1)
      : 0

    const topCandidats = await Candidature.aggregate([
      { $group: { _id: '$idCandidat', totalApplications: { $sum: 1 } } },
      { $sort: { totalApplications: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'utilisateurs', localField: '_id', foreignField: '_id', as: 'candidat' } },
      { $unwind: '$candidat' },
      { $project: { _id: 0, candidatId: '$_id', nom: '$candidat.nom', prenom: '$candidat.prenom', email: '$candidat.email', totalApplications: 1 } },
    ])

    const [commentairesTotal, noteMoyenne, hiddenCount] = await Promise.all([
      Commentaire.countDocuments(),
      Commentaire.aggregate([{ $group: { _id: null, avg: { $avg: '$note' } } }]),
      Commentaire.countDocuments({ visible: false }),
    ])
    const commentaires = {
      total: commentairesTotal,
      noteMoyenne: noteMoyenne[0] ? +noteMoyenne[0].avg.toFixed(2) : 0,
      hidden: hiddenCount,
    }

    const genreCandidats  = await Utilisateur.aggregate([{ $match: { role: 'candidat' } },  { $group: { _id: '$genre', count: { $sum: 1 } } }])
    const genreRecruteurs = await Utilisateur.aggregate([{ $match: { role: 'recruteur' } }, { $group: { _id: { $ifNull: ['$genre', 'nonSpecifie'] }, count: { $sum: 1 } } }])
    const genreDistribution = {
      candidats:  Object.fromEntries(genreCandidats.map(g  => [g._id || 'nonSpecifie', g.count])),
      recruteurs: Object.fromEntries(genreRecruteurs.map(g => [g._id, g.count])),
    }

    const matchStats = await Match.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$score' }, totalMatchs: { $sum: 1 }, highMatches: { $sum: { $cond: [{ $gte: ['$score', 0.75] }, 1, 0] } } } },
    ])

    const userGrowth = await Utilisateur.aggregate([
      { $match: { dateCreation: { $gte: day30 } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateCreation' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } },
    ])

    const topRecruteurs = await OffreTravail.aggregate([
      { $match: { statutOffre: 'ouvert' } },
      { $group: { _id: '$idRecruteur', totalOffres: { $sum: 1 } } },
      { $sort: { totalOffres: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'utilisateurs', localField: '_id', foreignField: '_id', as: 'recruteur' } },
      { $unwind: '$recruteur' },
      { $project: { _id: 0, recruteurId: '$_id', nomEntreprise: '$recruteur.nomEntreprise', secteurActivite: '$recruteur.secteurActivite', totalOffres: 1 } },
    ])

    res.json({
      users: { totalCandidats, totalRecruteurs, comptesBloques, recruteursEnAttente: recruteursEnAttenteCount, recruteursValideParIA, newUsersLast30d },
      offres: { total: totalOffres, ouvertes: offresOuvertes, fermees: offresFermees, newLast30d: newOffresLast30d, populaires: offresPopulaires, lesPlusMatchées: offresLesPlusMatchées, recruteursEmbauche: recruteursAvecEmbauche },
      candidatures: { total: totalCandidatures, last7d: candidaturesLast7d, parStatut: Object.fromEntries(candidaturesParStatut.map(s => [s._id, s.count])) },
      aiVerification: aiVerifSummary,
      engagementCandidats: { totalCandidatsActifs, moyCandidaturesParCandidat, topCandidats },
      commentaires,
      genreDistribution,
      userGrowth,
      topRecruteurs,
      aiMatch: matchStats[0]
        ? { totalMatchs: matchStats[0].totalMatchs, avgScore: Math.round(matchStats[0].avgScore * 100), highMatches: matchStats[0].highMatches }
        : { totalMatchs: 0, avgScore: 0, highMatches: 0 },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── GET /api/admin/commentaires ───────────────────────────────────────────────
const getAllCommentaires = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1
    const limit  = parseInt(req.query.limit) || 15
    const filter = {}
    if (req.query.visible === 'true')  filter.visible = true
    if (req.query.visible === 'false') filter.visible = false

    const [commentaires, total] = await Promise.all([
      Commentaire.find(filter)
        .populate('idAuteur',    'prenom nom email statusCompte')
        .populate('idRecruteur', 'nom nomEntreprise email statusCompte')
        .sort({ dateCreation: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Commentaire.countDocuments(filter),
    ])

    res.json({ commentaires, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  listerUtilisateurs, recruteursEnAttente, getUtilisateur,
  getRecruteurDossier, validerRecruteur, reVerifyDocument,
  toggleSuspension, supprimerUtilisateur,
  toutesLesCandidatures, getDashboardStats, getAllCommentaires,
}