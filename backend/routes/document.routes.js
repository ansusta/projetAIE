const express = require('express')
const router  = express.Router()
const multer  = require('../config/multer')
const {
  uploadFile,
  downloadFile,
  deleteFile,
  getDocsByCandidat,
  getDocsByRecruteur,
  triggerVerification,
} = require('../controllers/document.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.post('/upload',                    multer.single('file'),    uploadFile)
router.get('/file/:fileId',                                         downloadFile)
router.delete('/:id',                     authenticate,             deleteFile)
router.get('/candidat/:idCandidat',                                 getDocsByCandidat)

// Recruiter documents + AI verification (admin protected)
router.get('/recruteur/:idRecruteur',     authenticate, authorize('admin'), getDocsByRecruteur)
router.post('/:id/verify',               authenticate, authorize('admin'), triggerVerification)

module.exports = router