const Signalement = require('../models/signalement')
const Utilisateur = require('../models/Utilisateur')
const { createNotification } = require('../utils/notification')

// ── POST /api/signalements/recruteur/:idRecruteur ─────────────────────────────
// Candidate creates / updates a report against a recruiter
const signalerRecruteur = async (req, res) => {
  try {
    if (req.user.role !== 'candidat')
      return res.status(403).json({ error: 'Seuls les candidats peuvent signaler un recruteur.' })

    const { motif, description } = req.body
    if (!motif)
      return res.status(400).json({ error: 'Le motif est requis.' })

    const recruteur = await Utilisateur.findById(req.params.idRecruteur)
    if (!recruteur || recruteur.role !== 'recruteur')
      return res.status(404).json({ error: 'Recruteur introuvable.' })

    // Upsert: one signalement per (signaleur, recruteur) pair
    const existing = await Signalement.findOne({
      idSignaleur : req.user._id,
      idRecruteur : req.params.idRecruteur,
    })

    if (existing) {
      existing.motif       = motif
      existing.description = description || ''
      existing.statut      = 'en_attente' // reopen if previously processed
      existing.dateSignalement = new Date()
      await existing.save()
      return res.json({ message: 'Signalement mis à jour.', signalement: existing })
    }

    const signalement = await Signalement.create({
      idSignaleur : req.user._id,
      idRecruteur : req.params.idRecruteur,
      motif,
      description : description || '',
    })

    res.status(201).json({ message: 'Signalement envoyé.', signalement })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── GET /api/signalements  (admin only) ──────────────────────────────────────
// Lists all signalements with optional status filter
const listerSignalements = async (req, res) => {
  try {
    const { statut, page = 1, limit = 20 } = req.query
    const filter = statut ? { statut } : {}

    const total = await Signalement.countDocuments(filter)
    const signalements = await Signalement.find(filter)
      .populate('idSignaleur', 'prenom nom email')
      .populate('idRecruteur', 'nomEntreprise email etatValidation statusCompte')
      .sort({ dateSignalement: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.json({ signalements, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── PATCH /api/signalements/:id  (admin only) ─────────────────────────────────
// Admin decides: 'ignore' or 'traite' (+ optional ban of recruiter)
const traiterSignalement = async (req, res) => {
  try {
    const { statut, noteAdmin, banirRecruteur } = req.body

    if (!['ignore', 'traite'].includes(statut))
      return res.status(400).json({ error: "statut doit être 'ignore' ou 'traite'." })

    const signalement = await Signalement.findById(req.params.id)
      .populate('idRecruteur', 'nomEntreprise email statusCompte')
    if (!signalement) return res.status(404).json({ error: 'Signalement introuvable.' })

    signalement.statut         = statut
    signalement.noteAdmin      = noteAdmin || ''
    signalement.dateTraitement = new Date()
    signalement.traitePar      = req.user._id
    await signalement.save()

    // Optionally ban the recruiter
    if (banirRecruteur && statut === 'traite') {
      await Utilisateur.findByIdAndUpdate(signalement.idRecruteur._id, {
        statusCompte: 'bloque',
      })

      // Notify the recruiter
      await createNotification({
        idUtilisateur: signalement.idRecruteur._id,
        contenu: '🚫 Votre compte a été suspendu suite à un signalement. Contactez le support pour plus d\'informations.',
      })
    }

    // Notify the reporter of the outcome
    const notifContenu = statut === 'ignore'
      ? 'Votre signalement a été examiné et classé sans suite par notre équipe.'
      : banirRecruteur
        ? '✅ Votre signalement a été traité. Le recruteur a été suspendu.'
        : '✅ Votre signalement a été traité par notre équipe.'

    await createNotification({
      idUtilisateur: signalement.idSignaleur,
      contenu       : notifContenu,
    })

    res.json({ message: 'Signalement traité.', signalement })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── GET /api/signalements/mon-signalement/:idRecruteur ───────────────────────
// Candidate checks if they already reported a recruiter
const getMonSignalement = async (req, res) => {
  try {
    const signalement = await Signalement.findOne({
      idSignaleur : req.user._id,
      idRecruteur : req.params.idRecruteur,
    })
    res.json(signalement || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  signalerRecruteur,
  listerSignalements,
  traiterSignalement,
  getMonSignalement,
}