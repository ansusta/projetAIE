const express = require("express")
const router = express.Router()
const multer = require("../config/multer")
const {
  signupCandidat,
  signupRecruteur,
  login,
  getMe,
  changePassword,
  updateProfile,
   getProfilPublic,
    mettreAJourPreferences, getProfilPublicRecruteur
} = require("../controllers/auth.controller")
const { authenticate , authorize} = require("../middleware/auth.middleware")

// Public
router.post("/signup/candidat", signupCandidat)
router.post("/signup/recruteur", signupRecruteur)
router.post("/login", login)
router.get('/users/:id/profil',  getProfilPublic)
router.get('/recruteurs/:id/profil', getProfilPublicRecruteur)

// Protected — require valid JWT
router.get("/me", authenticate, getMe)
router.put("/change-password", authenticate, changePassword)
router.put("/update-profile", authenticate, multer.single("photoProfil"), updateProfile)
router.put('/preferences',       authenticate, authorize('candidat'), mettreAJourPreferences)

module.exports = router