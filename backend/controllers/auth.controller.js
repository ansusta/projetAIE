const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Utilisateur = require("../models/Utilisateur")
const cloudinary = require("../config/cloud");
const { Readable } = require("stream");

// Helper for Cloudinary Buffer Upload
const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "profile_pics" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

// ─── UPDATE PROFILE ───────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    let updateData = { ...req.body };

    // 1. Handle Profile Picture if a file is uploaded
    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      updateData.photoProfil = result.secure_url;
    }

    // 2. Prevent users from changing sensitive fields via this route
    delete updateData.motDePasse;
    delete updateData.role;
    delete updateData.email;
    delete updateData.etatValidation;

    // 3. Update the user
    const updatedUser = await Utilisateur.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        photoProfil: updatedUser.photoProfil,
        nom: updatedUser.nom || updatedUser.nomEntreprise,
        bio: updatedUser.bio,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    // req.user is already populated by authenticate middleware
    const user = req.user

    const base = {
      id: user._id,
      email: user.email,
      role: user.role,
      telephone: user.telephone,
      statusCompte: user.statusCompte,
      adresse: user.adresse,
      createdAt: user.createdAt,
      photoProfil: user.photoProfil
    }

    if (user.role === "candidat") {
      return res.json({
        ...base,
        nom: user.nom,
        prenom: user.prenom,
        dateNaissance: user.dateNaissance,
        bio: user.bio
      })
    }

    if (user.role === "recruteur") {
      return res.json({
        ...base,
        nomEntreprise: user.nomEntreprise,
        descriptionEntreprise: user.descriptionEntreprise,
        secteurActivite: user.secteurActivite,
        etatValidation: user.etatValidation
      })
    }

    // admin
    res.json(base)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ─── CHANGE PASSWORD ──────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    console.log("Headers:", req.headers['content-type']);
  console.log("Body:", req.body);
    const { ancienMotDePasse, nouveauMotDePasse } = req.body

    if (!ancienMotDePasse || !nouveauMotDePasse)
      return res.status(400).json({ error: "Both fields are required" })

    if (nouveauMotDePasse.length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters" })

    // Fetch with password (req.user comes without it from middleware)
    const user = await Utilisateur.findById(req.user._id)

    const isMatch = await bcrypt.compare(ancienMotDePasse, user.motDePasse)
    if (!isMatch)
      return res.status(401).json({ error: "Current password is incorrect" })

    user.motDePasse = await bcrypt.hash(nouveauMotDePasse, 10)
    await user.save()

    res.json({ message: "Password updated successfully" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
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

module.exports = { signupCandidat, signupRecruteur, login, getMe, changePassword, updateProfile }