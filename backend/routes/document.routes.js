const express = require("express")
const router = express.Router()
const multer = require("../config/multer")
const { 
  uploadFile, 
  downloadFile, 
  deleteFile, 
  getDocsByCandidat 
} = require("../controllers/document.controller")

// ─── ROUTES ───────────────────────────────────────────────

router.post("/upload", multer.single("file"), uploadFile)
router.get("/file/:fileId", downloadFile)
router.delete("/:id", deleteFile)
router.get("/candidat/:idCandidat", getDocsByCandidat)

module.exports = router