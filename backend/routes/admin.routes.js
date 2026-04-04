const express = require('express')
const router  = express.Router()
const {
  listerUtilisateurs, recruteursEnAttente, getUtilisateur,
  validerRecruteur, toggleSuspension, supprimerUtilisateur, toutesLesCandidatures
} = require('../controllers/admin.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')


router.use(authenticate, authorize('admin')) // entire router is admin-only

// ⚠️ specific routes BEFORE /:id to avoid shadowing
router.get('/candidatures', toutesLesCandidatures)
router.get('/users/recruteurs/en-attente', recruteursEnAttente)
router.get('/users',                        listerUtilisateurs)
router.get('/users/:id',                    getUtilisateur)
router.patch('/users/:id/validate',         validerRecruteur)
router.patch('/users/:id/suspend',          toggleSuspension)
router.delete('/users/:id',                 supprimerUtilisateur)

module.exports = router