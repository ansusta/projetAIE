const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Utilisateur = require("../models/Utilisateur")

// ─── SIGNUP CANDIDAT ──────────────────────────────────────
const signupCandidat = async (req, res) => {
  try {
    const {
      email, motDePasse, telephone,
      nom, prenom, dateNaissance, bio,
      adresse
    } = req.body

    // check if email already exists
    const existing = await Utilisateur.findOne({ email })
    if (existing) return res.status(400).json({ error: "Email already in use" })

    // hash password
    const hashedPassword = await bcrypt.hash(motDePasse, 10)

    const candidat = await Utilisateur.create({
      email,
      motDePasse: hashedPassword,
      telephone,
      role: "candidat",
      statusCompte: "actif",
      nom,
      prenom,
      dateNaissance,
      bio,
      adresse
    })

    const token = jwt.sign(
      { id: candidat._id, role: candidat.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.status(201).json({
      token,
      user: {
        id: candidat._id,
        email: candidat.email,
        role: candidat.role,
        nom: candidat.nom,
        prenom: candidat.prenom
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ─── SIGNUP RECRUTEUR ─────────────────────────────────────
const signupRecruteur = async (req, res) => {
  try {
    const {
      email, motDePasse, telephone,
      nomEntreprise, descriptionEntreprise,
      secteurActivite, adresse
    } = req.body

    // check if email already exists
    const existing = await Utilisateur.findOne({ email })
    if (existing) return res.status(400).json({ error: "Email already in use" })

    // hash password
    const hashedPassword = await bcrypt.hash(motDePasse, 10)

    const recruteur = await Utilisateur.create({
      email,
      motDePasse: hashedPassword,
      telephone,
      role: "recruteur",
      statusCompte: "actif",
      etatValidation: "enAttente", // needs admin approval
      nomEntreprise,
      descriptionEntreprise,
      secteurActivite,
      adresse
    })

    const token = jwt.sign(
      { id: recruteur._id, role: recruteur.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.status(201).json({
      token,
      user: {
        id: recruteur._id,
        email: recruteur.email,
        role: recruteur.role,
        nomEntreprise: recruteur.nomEntreprise,
        etatValidation: recruteur.etatValidation
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body

    // check if user exists
    const user = await Utilisateur.findOne({ email })
    if (!user) return res.status(404).json({ error: "Email not found" })

    // check password
    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse)
    if (!isMatch) return res.status(401).json({ error: "Wrong password" })

    // check if account is blocked
    if (user.statusCompte === "bloque") 
      return res.status(403).json({ error: "Account is blocked" })

    // check if recruteur is validated (optional — depends on your logic)
    if (user.role === "recruteur" && user.etatValidation !== "valideParAdmin")
      return res.status(403).json({ error: "Account pending admin approval" })

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        nom: user.nom || null,
        prenom: user.prenom || null,
        nomEntreprise: user.nomEntreprise || null
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { signupCandidat, signupRecruteur, login }