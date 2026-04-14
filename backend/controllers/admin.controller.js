const Utilisateur = require('../models/Utilisateur')
const { createNotification } = require('../utils/notification')
const Candidature = require('../models/Candidature')
// add at the top alongside existing requires
const OffreTravail = require('../models/OffreTravail')
const Match        = require('../models/Match')
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

// GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const now   = new Date()
    const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000)  // last 30 days
    const day7  = new Date(now - 7  * 24 * 60 * 60 * 1000)  // last 7 days

    // ── Users ──────────────────────────────────────────────────────────
    const [
      totalCandidats,
      totalRecruteurs,
      comptesBloques,
      recruteursEnAttenteCount,
      newUsersLast30d
    ] = await Promise.all([
      Utilisateur.countDocuments({ role: 'candidat' }),
      Utilisateur.countDocuments({ role: 'recruteur' }),
      Utilisateur.countDocuments({ statusCompte: 'bloque' }),
      Utilisateur.countDocuments({ role: 'recruteur', etatValidation: 'enAttente' }),
      Utilisateur.countDocuments({ dateCreation: { $gte: day30 } })
    ])

    // ── Offers ─────────────────────────────────────────────────────────
    const [
      totalOffres,
      offresOuvertes,
      offresFermees,
      newOffresLast30d
    ] = await Promise.all([
      OffreTravail.countDocuments(),
      OffreTravail.countDocuments({ statutOffre: 'ouvert' }),
      OffreTravail.countDocuments({ statutOffre: 'fermer' }),
      OffreTravail.countDocuments({ datePublication: { $gte: day30 } })
    ])

    // ── Candidatures ───────────────────────────────────────────────────
    const [
      totalCandidatures,
      candidaturesLast7d,
      candidaturesParStatut
    ] = await Promise.all([
      Candidature.countDocuments(),
      Candidature.countDocuments({ dateCandidature: { $gte: day7 } }),
      Candidature.aggregate([
        { $group: { _id: '$etatCandidature', count: { $sum: 1 } } }
      ])
    ])

    // ── Trending offers (most applications in last 30 days) ─────────────
    const trendingOffres = await Candidature.aggregate([
      { $match: { dateCandidature: { $gte: day30 } } },
      { $group: { _id: '$idOffre', totalCandidatures: { $sum: 1 } } },
      { $sort: { totalCandidatures: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'offretravails',
          localField: '_id',
          foreignField: '_id',
          as: 'offre'
        }
      },
      { $unwind: '$offre' },
      {
        $project: {
          _id: 0,
          offreId: '$_id',
          titre: '$offre.titre',
          typeContrat: '$offre.typeContrat',
          localisation: '$offre.localisation',
          statutOffre: '$offre.statutOffre',
          totalCandidatures: 1
        }
      }
    ])

    // ── User growth — signups per day for last 30 days ─────────────────
    const userGrowth = await Utilisateur.aggregate([
      { $match: { dateCreation: { $gte: day30 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$dateCreation' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } }
    ])

    // ── Top recruiters by number of open offers ────────────────────────
    const topRecruteurs = await OffreTravail.aggregate([
      { $match: { statutOffre: 'ouvert' } },
      { $group: { _id: '$idRecruteur', totalOffres: { $sum: 1 } } },
      { $sort: { totalOffres: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'utilisateurs',
          localField: '_id',
          foreignField: '_id',
          as: 'recruteur'
        }
      },
      { $unwind: '$recruteur' },
      {
        $project: {
          _id: 0,
          recruteurId: '$_id',
          nomEntreprise: '$recruteur.nomEntreprise',
          secteurActivite: '$recruteur.secteurActivite',
          totalOffres: 1
        }
      }
    ])

    // ── AI Match stats ─────────────────────────────────────────────────
    const matchStats = await Match.aggregate([
      {
        $group: {
          _id: null,
          avgScore:  { $avg: '$score' },
          totalMatchs: { $sum: 1 },
          highMatches: { $sum: { $cond: [{ $gte: ['$score', 0.75] }, 1, 0] } }
        }
      }
    ])

    res.json({
      users: {
        totalCandidats,
        totalRecruteurs,
        comptesBloques,
        recruteursEnAttente: recruteursEnAttenteCount,
        newUsersLast30d
      },
      offres: {
        total: totalOffres,
        ouvertes: offresOuvertes,
        fermees: offresFermees,
        newLast30d: newOffresLast30d
      },
      candidatures: {
        total: totalCandidatures,
        last7d: candidaturesLast7d,
        parStatut: Object.fromEntries(
          candidaturesParStatut.map(s => [s._id, s.count])
        )
      },
      trendingOffres,
      userGrowth,
      topRecruteurs,
      aiMatch: matchStats[0]
        ? {
            totalMatchs:  matchStats[0].totalMatchs,
            avgScore:     Math.round(matchStats[0].avgScore * 100),
            highMatches:  matchStats[0].highMatches
          }
        : { totalMatchs: 0, avgScore: 0, highMatches: 0 }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
module.exports = { listerUtilisateurs, recruteursEnAttente, getUtilisateur, validerRecruteur, toggleSuspension, supprimerUtilisateur, toutesLesCandidatures, getDashboardStats  }