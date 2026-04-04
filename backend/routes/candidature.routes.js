const express = require('express')
const router  = express.Router()
const {
  soumettreCandidature, mesCandidatures, candidaturesParOffre,
  getCandidature, mettreAJourStatut, planifierEntretien, getEntretiens, getCandidaturesGrouped
} = require('../controllers/candidature.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate) // all candidature routes are protected
// add to candidature.routes.js — BEFORE /:id
router.get('/entretiens',        authorize('recruteur'), getEntretiens)
router.get('/recruteur/grouped', authorize('recruteur'), getCandidaturesGrouped)
router.post('/',                   authorize('candidat'),   soumettreCandidature)
router.get('/mes-candidatures',    authorize('candidat'),   mesCandidatures)
router.get('/offre/:offreId',      authorize('recruteur'),  candidaturesParOffre)
router.get('/:id',                                          getCandidature)      // candidat + recruteur + admin
router.patch('/:id/statut',        authorize('recruteur'),  mettreAJourStatut)
router.post('/:id/entretien',      authorize('recruteur'),  planifierEntretien)




module.exports = router