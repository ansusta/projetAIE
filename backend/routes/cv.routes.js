const express = require('express')
const router  = express.Router()
const {
  creerOuRemplacerCV,
  getMonCV,
  mettreAJourCV,
  supprimerCV,
  getCVPublic,
  ajouterExperience,
  supprimerExperience,
  ajouterFormation,
  supprimerFormation
} = require('../controllers/cv.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

// ── Candidate-only routes ─────────────────────────────────────────────────────
router.post  ('/',                    authenticate, authorize('candidat'), creerOuRemplacerCV)
router.get   ('/me',                  authenticate, authorize('candidat'), getMonCV)
router.patch ('/',                    authenticate, authorize('candidat'), mettreAJourCV)
router.delete('/',                    authenticate, authorize('candidat'), supprimerCV)

// Section helpers
router.post  ('/experience',          authenticate, authorize('candidat'), ajouterExperience)
router.delete('/experience/:expId',   authenticate, authorize('candidat'), supprimerExperience)
router.post  ('/formation',           authenticate, authorize('candidat'), ajouterFormation)
router.delete('/formation/:formId',   authenticate, authorize('candidat'), supprimerFormation)

// ── Public / recruiter view ───────────────────────────────────────────────────
router.get('/:candidatId', authenticate, getCVPublic)

module.exports = router