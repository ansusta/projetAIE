const express = require('express')
const router  = express.Router()
const {
  soumettreCandidature, mesCandidatures, candidaturesParOffre,
  getCandidature, mettreAJourStatut, planifierEntretien
} = require('../controllers/candidature.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate) // all candidature routes are protected

router.post('/',                   authorize('candidat'),   soumettreCandidature)
router.get('/mes-candidatures',    authorize('candidat'),   mesCandidatures)
router.get('/offre/:offreId',      authorize('recruteur'),  candidaturesParOffre)
router.get('/:id',                                          getCandidature)      // candidat + recruteur + admin
router.patch('/:id/statut',        authorize('recruteur'),  mettreAJourStatut)
router.post('/:id/entretien',      authorize('recruteur'),  planifierEntretien)

module.exports = router