const mongoose = require('mongoose')

// Sub-schema for Gemini AI verification result
const aiVerificationSchema = new mongoose.Schema({
  verdict: {
    type: String,
    enum: ['approuve', 'rejete', 'necessiteRevision'],
  },
  confidence:    { type: Number, min: 0, max: 100 }, // 0-100
  typeDetecte:   String,   // e.g. "Registre du Commerce", "Carte Nationale d'Identité"
  raison:        String,   // Human-readable explanation from Gemini
  flags:         [String], // e.g. ["document_flou", "date_expiree", "informations_manquantes"]
  dateVerification: { type: Date, default: Date.now },
  modelUtilise:  { type: String, default: 'gemini-1.5-flash' },
}, { _id: false })

const documentSchema = new mongoose.Schema({
  fileId:        { type: mongoose.Schema.Types.ObjectId, required: true },
  nomFichier:    String,
  formatFichier: String,
  taille:        Number,
  dateUpload:    { type: Date, default: Date.now },

  type: {
    type:      String,
    enum:      ['cv', 'docsupp', 'docrecruteur'],
    lowercase: true,
    trim:      true,
  },

  // CV fields
  resume:           String,
  derniereMisAjour: Date,

  // Candidate-linked
  idCandidat:  { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
  typeFichier: String,

  // Recruiter-linked
  idRecruteur:  { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
  typeDocument: String,          // what the uploader claims: "rc", "nif", "cni", etc.

  // Verification pipeline
  estVerifie:      { type: Boolean, default: false },  // true once admin gives final decision
  dateVerifie:     Date,
  aiVerification:  aiVerificationSchema,               // Gemini result (null until processed)
  verificationEnCours: { type: Boolean, default: false }, // prevents duplicate AI calls
})

module.exports = mongoose.model('Document', documentSchema)