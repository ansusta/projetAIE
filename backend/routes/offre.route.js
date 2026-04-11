const express = require('express')
const router  = express.Router()
const { creerOffre, listerOffres, mesOffres, getOffre, modifierOffre, supprimerOffre }
  = require('../controllers/offre.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')



router.get('/mes-offres',  authenticate, authorize('recruteur'), mesOffres)

router.get('/',    listerOffres)
router.get('/:id', getOffre)
router.post('/',           authenticate, authorize('recruteur'), creerOffre)
router.put('/:id',         authenticate, authorize('recruteur'), modifierOffre)
router.delete('/:id',      authenticate, authorize('recruteur', 'admin'), supprimerOffre)

module.exports = router