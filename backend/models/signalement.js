const mongoose = require('mongoose')

const signalementSchema = new mongoose.Schema({
  idSignaleur  : { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  idRecruteur  : { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  motif        : {
    type    : String,
    required: true,
    enum    : [
      'comportement_inapproprie',
      'offre_frauduleuse',
      'discrimination',
      'harcelement',
      'fausse_identite',
      'autre',
    ],
  },
  description  : { type: String, maxlength: 2000 },
  dateSignalement: { type: Date, default: Date.now },
  statut       : {
    type    : String,
    enum    : ['en_attente', 'ignore', 'traite'],
    default : 'en_attente',
  },
  // Admin decision
  noteAdmin    : { type: String },
  dateTraitement: { type: Date },
  traitePar    : { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
})

// One report per candidate per recruiter (can update by re-submitting)
signalementSchema.index({ idSignaleur: 1, idRecruteur: 1 }, { unique: true })

module.exports = mongoose.model('Signalement', signalementSchema)