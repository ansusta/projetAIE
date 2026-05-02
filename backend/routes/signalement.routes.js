const express = require('express')
const router  = express.Router()
const {
  signalerRecruteur,
  listerSignalements,
  traiterSignalement,
  getMonSignalement,
} = require('../controllers/signalement.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

// Candidate routes
router.post(
  '/recruteur/:idRecruteur',
  authenticate,
  authorize('candidat'),
  signalerRecruteur
)

router.get(
  '/mon-signalement/:idRecruteur',
  authenticate,
  authorize('candidat'),
  getMonSignalement
)

// Admin routes
router.get('/',     authenticate, authorize('admin'), listerSignalements)
router.patch('/:id', authenticate, authorize('admin'), traiterSignalement)

module.exports = router