const express = require('express')
const router  = express.Router()
const {
  listerUtilisateurs, recruteursEnAttente, getUtilisateur,
  getRecruteurDossier, validerRecruteur, reVerifyDocument,
  toggleSuspension, supprimerUtilisateur,
  toutesLesCandidatures, getDashboardStats,getAllCommentaires
} = require('../controllers/admin.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

// All routes admin-only
router.use(authenticate, authorize('admin'))

router.get('/stats',                              getDashboardStats)
router.get('/candidatures',                       toutesLesCandidatures)

// ⚠️  Specific routes BEFORE /:id to avoid shadowing
router.get('/users/recruteurs/en-attente',        recruteursEnAttente)
router.get('/users',                              listerUtilisateurs)
router.get('/users/:id',                          getUtilisateur)
router.patch('/users/:id/validate',               validerRecruteur)
router.patch('/users/:id/suspend',                toggleSuspension)
router.delete('/users/:id',                       supprimerUtilisateur)

// Dossier view: recruiter profile + all docs + AI verdicts
router.get('/recruteurs/:id/dossier',             getRecruteurDossier)

// Re-trigger AI verification on a specific document
router.post('/documents/:docId/re-verify',        reVerifyDocument)
router.get('/commentaires', getAllCommentaires) // add before module.exports

module.exports = router