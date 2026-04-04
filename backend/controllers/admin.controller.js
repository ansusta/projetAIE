const Utilisateur = require('../models/Utilisateur')
const { createNotification } = require('../utils/notification')
const Candidature = require('../models/Candidature')
// GET /api/admin/users
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

// GET /api/admin/users/recruteurs/en-attente
const recruteursEnAttente = async (req, res) => {
  try {
    const users = await Utilisateur.find({ role: 'recruteur', etatValidation: 'enAttente' })
      .select('-motDePasse')
      .sort({ dateCreation: -1 })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// GET /api/admin/users/:id
const getUtilisateur = async (req, res) => {
  try {
    const user = await Utilisateur.findById(req.params.id).select('-motDePasse')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/admin/users/:id/validate   body: { decision: 'valideParAdmin' | 'refuse' }
const validerRecruteur = async (req, res) => {
  try {
    const { decision } = req.body
    if (!['valideParAdmin', 'refuse'].includes(decision))
      return res.status(400).json({ error: "decision must be 'valideParAdmin' or 'refuse'" })

    const user = await Utilisateur.findById(req.params.id)
    if (!user)               return res.status(404).json({ error: 'User not found' })
    if (user.role !== 'recruteur') return res.status(400).json({ error: 'Not a recruiter' })

    user.etatValidation = decision
    await user.save()

    await createNotification({
      idUtilisateur: user._id,
      contenu: decision === 'valideParAdmin'
        ? 'Votre compte recruteur a été validé. Vous pouvez maintenant publier des offres.'
        : 'Votre demande de compte recruteur a été refusée.'
    })

    res.json({ message: `Recruiter ${decision === 'valideParAdmin' ? 'validated' : 'rejected'}` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/admin/users/:id/suspend  — toggles actif ↔ bloque
const toggleSuspension = async (req, res) => {
  try {
    const user = await Utilisateur.findById(req.params.id)
    if (!user)               return res.status(404).json({ error: 'User not found' })
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot suspend an admin' })

    user.statusCompte = user.statusCompte === 'bloque' ? 'actif' : 'bloque'
    await user.save()

    res.json({ message: `Account ${user.statusCompte === 'bloque' ? 'suspended' : 'reactivated'}`, statusCompte: user.statusCompte })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE /api/admin/users/:id
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

const toutesLesCandidatures = async (req, res) => {
  try {
    const { etatCandidature, page = 1, limit = 20 } = req.query
    const filter = {}
    if (etatCandidature) filter.etatCandidature = etatCandidature

    const total = await Candidature.countDocuments(filter)
    const candidatures = await Candidature.find(filter)
      .populate('idCandidat', 'nom prenom email')
      .populate('idOffre', 'titre idRecruteur')
      .sort({ dateCandidature: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.json({ candidatures, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


module.exports = { listerUtilisateurs, recruteursEnAttente, getUtilisateur, validerRecruteur, toggleSuspension, supprimerUtilisateur, toutesLesCandidatures }