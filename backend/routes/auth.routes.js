const express = require("express")
const router = express.Router()
const { signupCandidat, signupRecruteur, login } = require("../controllers/auth.controller")

router.post("/signup/candidat", signupCandidat)
router.post("/signup/recruteur", signupRecruteur)
router.post("/login", login)

module.exports = router