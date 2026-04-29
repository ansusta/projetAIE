const express = require('express')
const router  = express.Router()
const multer  = require('../config/multer')
const {
  uploadFile, downloadFile, deleteFile,
  getDocsByCandidat, getDocsByRecruteur,
  triggerVerification, getMyVerificationStatus,
} = require('../controllers/document.controller')
const { authenticate, authorize, ownerOrAdmin } = require('../middleware/auth.middleware')

// ── Candidate docs ────────────────────────────────────────────────────────────
router.get('/candidat/:idCandidat', authenticate, ownerOrAdmin, getDocsByCandidat)

// ── Recruiter docs ────────────────────────────────────────────────────────────
// Own status + docs (used by VerificationPage)
router.get('/recruteur/status',        authenticate, authorize('recruteur'), getMyVerificationStatus)

// Own docs list (owner or admin)
router.get('/recruteur/:idRecruteur',  authenticate, ownerOrAdmin,           getDocsByRecruteur)

// Upload — auth required; idRecruteur is taken from token inside controller
router.post('/upload',                 authenticate, multer.single('file'),  uploadFile)

// Download — auth required; ownership verified inside controller
router.get('/file/:fileId',            authenticate,                         downloadFile)

router.delete('/:id',                  authenticate,                         deleteFile)

// AI verification (admin only)
router.post('/:id/verify',             authenticate, authorize('admin'),     triggerVerification)

module.exports = router