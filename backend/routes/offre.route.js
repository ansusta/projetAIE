const express = require('express')
const router  = express.Router()
const { creerOffre, listerOffres, mesOffres, getOffre, modifierOffre, supprimerOffre }
  = require('../controllers/offre.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

// public
router.get('/',    listerOffres)
router.get('/:id', getOffre)

// protected
router.get('/mes-offres',  authenticate, authorize('recruteur'), mesOffres)
router.post('/',           authenticate, authorize('recruteur'), creerOffre)
router.put('/:id',         authenticate, authorize('recruteur'), modifierOffre)
router.delete('/:id',      authenticate, authorize('recruteur', 'admin'), supprimerOffre)

module.exports = router