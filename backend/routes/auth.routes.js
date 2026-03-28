const express = require("express")
const router = express.Router()
const multer = require("../config/multer")
const {
  signupCandidat,
  signupRecruteur,
  login,
  getMe,
  changePassword,
  updateProfile
} = require("../controllers/auth.controller")
const { authenticate } = require("../middleware/auth.middleware")

// Public
router.post("/signup/candidat", signupCandidat)
router.post("/signup/recruteur", signupRecruteur)
router.post("/login", login)

// Protected — require valid JWT
router.get("/me", authenticate, getMe)
router.put("/change-password", authenticate, changePassword)


router.put("/update-profile", authenticate, multer.single("photoProfil"), updateProfile)

module.exports = router