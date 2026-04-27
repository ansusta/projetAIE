const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const Utilisateur = require('../models/Utilisateur')
const cloudinary  = require('../config/cloud')
const { Readable } = require('stream')
const CV = require('../models/CV')

// ── Cloudinary stream upload ──────────────────────────────────────────────────
const streamUpload = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'profile_pics' },
      (error, result) => { if (result) resolve(result); else reject(error) }
    )
    Readable.from(buffer).pipe(stream)
  })

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const userId     = req.user._id
    let   updateData = { ...req.body }

    if (req.file) {
      const result = await streamUpload(req.file.buffer)
      updateData.photoProfil = result.secure_url
    }

    // Prevent sensitive fields from being changed via this route
    delete updateData.motDePasse
    delete updateData.role
    delete updateData.email
    delete updateData.etatValidation

    // Validate genre if supplied
    const genresValides = ['homme', 'femme', 'autre', 'nonSpecifie']
    if (updateData.genre && !genresValides.includes(updateData.genre)) {
      return res.status(400).json({ error: `genre must be one of: ${genresValides.join(', ')}` })
    }

    const updatedUser = await Utilisateur.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    )

    if (!updatedUser) return res.status(404).json({ error: 'User not found' })

    res.json({
      message: 'Profile updated successfully',
      user: {
        id          : updatedUser._id,
        photoProfil : updatedUser.photoProfil,
        nom         : updatedUser.nom || updatedUser.nomEntreprise,
        bio         : updatedUser.bio,
        genre       : updatedUser.genre
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── GET ME ────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = req.user

    const base = {
      id          : user._id,
      email       : user.email,
      role        : user.role,
      telephone   : user.telephone,
      statusCompte: user.statusCompte,
      adresse     : user.adresse,
      createdAt   : user.createdAt,
      photoProfil : user.photoProfil
    }

    if (user.role === 'candidat') {
      return res.json({
        ...base,
        nom           : user.nom,
        prenom        : user.prenom,
        dateNaissance : user.dateNaissance,
        genre         : user.genre || 'nonSpecifie',
        bio           : user.bio,
        preferences   : user.preference || {}
      })
    }

if (user.role === 'recruteur') {
  return res.json({
    ...base,
    adresse              : user.adresse,          // ← was missing
    nomEntreprise        : user.nomEntreprise,
    descriptionEntreprise: user.descriptionEntreprise,
    secteurActivite      : user.secteurActivite,
    etatValidation       : user.etatValidation
  })
}

    res.json(base)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body

    if (!ancienMotDePasse || !nouveauMotDePasse)
      return res.status(400).json({ error: 'Both fields are required' })
    if (nouveauMotDePasse.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' })

    const user    = await Utilisateur.findById(req.user._id)
    const isMatch = await bcrypt.compare(ancienMotDePasse, user.motDePasse)
    if (!isMatch)
      return res.status(401).json({ error: 'Current password is incorrect' })

    user.motDePasse = await bcrypt.hash(nouveauMotDePasse, 10)
    await user.save()

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── SIGNUP CANDIDAT ───────────────────────────────────────────────────────────
const signupCandidat = async (req, res) => {
  try {
    const {
      email, motDePasse, telephone,
      nom, prenom, dateNaissance, bio, adresse,
      genre   // optional at signup, defaults to 'nonSpecifie' via model
    } = req.body

    const existing = await Utilisateur.findOne({ email })
    if (existing) return res.status(400).json({ error: 'Email already in use' })

    const hashedPassword = await bcrypt.hash(motDePasse, 10)

    const candidat = await Utilisateur.create({
      email, motDePasse: hashedPassword, telephone,
      role: 'candidat', statusCompte: 'actif',
      nom, prenom, dateNaissance, bio, adresse,
      genre: genre || 'nonSpecifie'
    })

    const token = jwt.sign(
      { id: candidat._id, role: candidat.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: {
        id    : candidat._id,
        email : candidat.email,
        role  : candidat.role,
        nom   : candidat.nom,
        prenom: candidat.prenom,
        genre : candidat.genre
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── SIGNUP RECRUTEUR ──────────────────────────────────────────────────────────
const signupRecruteur = async (req, res) => {
  try {
    const {
      email, motDePasse, telephone,
      nomEntreprise, descriptionEntreprise, secteurActivite, adresse
    } = req.body

    const existing = await Utilisateur.findOne({ email })
    if (existing) return res.status(400).json({ error: 'Email already in use' })

    const hashedPassword = await bcrypt.hash(motDePasse, 10)

    const recruteur = await Utilisateur.create({
      email, motDePasse: hashedPassword, telephone,
      role: 'recruteur', statusCompte: 'actif',
      etatValidation: 'enAttente',
      nomEntreprise, descriptionEntreprise, secteurActivite, adresse
    })

    const token = jwt.sign(
      { id: recruteur._id, role: recruteur.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: {
        id            : recruteur._id,
        email         : recruteur.email,
        role          : recruteur.role,
        nomEntreprise : recruteur.nomEntreprise,
        etatValidation: recruteur.etatValidation
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body

    const user = await Utilisateur.findOne({ email })
    if (!user) return res.status(404).json({ error: 'Email not found' })

    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse)
    if (!isMatch) return res.status(401).json({ error: 'Wrong password' })

    if (user.statusCompte === 'bloque')
      return res.status(403).json({ error: 'Account is blocked' })

    if (user.role === 'recruteur' && user.etatValidation !== 'valideParAdmin')
      return res.status(403).json({ error: 'Account pending admin approval' })

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id           : user._id,
        email        : user.email,
        role         : user.role,
        nom          : user.nom          || null,
        prenom       : user.prenom       || null,
        nomEntreprise: user.nomEntreprise || null,
        genre        : user.genre        || null
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── GET PUBLIC PROFILE ────────────────────────────────────────────────────────
// ── GET PUBLIC PROFILE (candidat) ─────────────────────────────────────────────
const getProfilPublic = async (req, res) => {
  try {
    const user = await Utilisateur.findById(req.params.id)
      .select('nom prenom bio adresse role photoProfil idCv')

    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.role !== 'candidat')
      return res.status(400).json({ error: 'Use /recruteurs/:id/profil for recruiter profiles' })

    // Fetch the candidate's CV if it exists
    const cv = user.idCv
      ? await CV.findById(user.idCv).select(
          'titrePoste formations experiences competences langues loisirs derniereMisAjour'
        )
      : null

    res.json({
      id         : user._id,
      nom        : user.nom,
      prenom     : user.prenom,
      bio        : user.bio,
      adresse    : user.adresse,
      photoProfil: user.photoProfil,
      cv         : cv || null
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── GET PUBLIC PROFILE (recruteur) ────────────────────────────────────────────
const getProfilPublicRecruteur = async (req, res) => {
  try {
    const user = await Utilisateur.findById(req.params.id)
      .select('nomEntreprise descriptionEntreprise secteurActivite adresse photoProfil role etatValidation')

    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.role !== 'recruteur')
      return res.status(400).json({ error: 'This profile belongs to a non-recruiter user' })
    if (user.etatValidation !== 'valideParAdmin')
      return res.status(403).json({ error: 'Recruiter profile not yet approved' })

    res.json({
      id                   : user._id,
      nomEntreprise        : user.nomEntreprise,
      descriptionEntreprise: user.descriptionEntreprise,
      secteurActivite      : user.secteurActivite,
      adresse              : user.adresse,
      photoProfil          : user.photoProfil
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
// ── UPDATE PREFERENCES (candidat only) ───────────────────────────────────────
const mettreAJourPreferences = async (req, res) => {
  try {
    if (req.user.role !== 'candidat')
      return res.status(403).json({ error: 'Only candidates have preferences' })

    const user = await Utilisateur.findById(req.user._id)
    user.preference = { ...(user.preference?.toObject() || {}), ...req.body }
    await user.save()

    res.json(user.preference)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  signupCandidat, signupRecruteur, login,
  getMe, changePassword, updateProfile,
  getProfilPublic, mettreAJourPreferences,getProfilPublicRecruteur
}