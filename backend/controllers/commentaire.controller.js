const Commentaire = require('../models/commentaire')
const Utilisateur = require('../models/Utilisateur')

// ── GET /api/commentaires/recruteur/:idRecruteur ──────────────────────────────
// Public — returns visible comments + average rating
const getCommentairesRecruteur = async (req, res) => {
  try {
    const commentaires = await Commentaire.find({
      idRecruteur : req.params.idRecruteur,
      visible     : true,
    })
      .populate('idAuteur', 'prenom nom photoProfil')
      .sort({ dateCreation: -1 })

    const total  = commentaires.length
    const moyenne = total > 0
      ? (commentaires.reduce((s, c) => s + c.note, 0) / total).toFixed(1)
      : null

    res.json({ commentaires, moyenne: moyenne ? Number(moyenne) : null, total })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── POST /api/commentaires/recruteur/:idRecruteur ─────────────────────────────
// Candidate only — create or update their comment
const creerOuMettreAJour = async (req, res) => {
  try {
    if (req.user.role !== 'candidat')
      return res.status(403).json({ error: 'Seuls les candidats peuvent laisser un avis.' })

    const { contenu, note } = req.body
    if (!contenu || !note)
      return res.status(400).json({ error: 'Le contenu et la note sont requis.' })
    if (note < 1 || note > 5)
      return res.status(400).json({ error: 'La note doit être entre 1 et 5.' })

    const recruteur = await Utilisateur.findById(req.params.idRecruteur)
    if (!recruteur || recruteur.role !== 'recruteur')
      return res.status(404).json({ error: 'Recruteur introuvable.' })

    const existing = await Commentaire.findOne({
      idAuteur   : req.user._id,
      idRecruteur: req.params.idRecruteur,
    })

    if (existing) {
      existing.contenu = contenu
      existing.note    = note
      existing.visible = true
      await existing.save()
      const populated = await existing.populate('idAuteur', 'prenom nom photoProfil')
      return res.json(populated)
    }

    const nouveau = await Commentaire.create({
      contenu,
      note,
      idAuteur   : req.user._id,
      idRecruteur: req.params.idRecruteur,
    })
    const populated = await nouveau.populate('idAuteur', 'prenom nom photoProfil')
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── DELETE /api/commentaires/:id ──────────────────────────────────────────────
// Author or admin
const supprimerCommentaire = async (req, res) => {
  try {
    const commentaire = await Commentaire.findById(req.params.id)
    if (!commentaire) return res.status(404).json({ error: 'Commentaire introuvable.' })

    const isAuthor = commentaire.idAuteur.toString() === req.user._id.toString()
    if (!isAuthor && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Non autorisé.' })

    await commentaire.deleteOne()
    res.json({ message: 'Commentaire supprimé.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── PATCH /api/commentaires/:id/visibilite  (admin only) ─────────────────────
const toggleVisibilite = async (req, res) => {
  try {
    const commentaire = await Commentaire.findById(req.params.id)
    if (!commentaire) return res.status(404).json({ error: 'Commentaire introuvable.' })

    commentaire.visible = !commentaire.visible
    await commentaire.save()
    res.json({ message: `Commentaire ${commentaire.visible ? 'visible' : 'masqué'}.`, visible: commentaire.visible })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── GET /api/commentaires/mon-avis/:idRecruteur  (candidate's own review) ────
const getMonAvis = async (req, res) => {
  try {
    const commentaire = await Commentaire.findOne({
      idAuteur   : req.user._id,
      idRecruteur: req.params.idRecruteur,
    })
    res.json(commentaire || null)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  getCommentairesRecruteur,
  creerOuMettreAJour,
  supprimerCommentaire,
  toggleVisibilite,
  getMonAvis,
}