const express = require('express')
const router  = express.Router()
const {
  getCommentairesRecruteur,
  creerOuMettreAJour,
  supprimerCommentaire,
  toggleVisibilite,
  getMonAvis,
} = require('../controllers/commentaire.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

// Public — anyone can read comments
router.get('/recruteur/:idRecruteur', getCommentairesRecruteur)

// Protected
router.post(
  '/recruteur/:idRecruteur',
  authenticate,
  authorize('candidat'),
  creerOuMettreAJour
)

router.get(
  '/mon-avis/:idRecruteur',
  authenticate,
  authorize('candidat'),
  getMonAvis
)

router.delete('/:id', authenticate, supprimerCommentaire)

// Admin only
router.patch(
  '/:id/visibilite',
  authenticate,
  authorize('admin'),
  toggleVisibilite
)

module.exports = router