const mongoose = require('mongoose')

const commentaireSchema = new mongoose.Schema({
  contenu      : { type: String, required: true, maxlength: 1000 },
  note         : { type: Number, min: 1, max: 5, required: true }, // star rating 1-5
  idAuteur     : { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  idRecruteur  : { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  dateCreation : { type: Date, default: Date.now },
  // Admin can hide abusive comments without deleting them
  visible      : { type: Boolean, default: true },
})

// One comment per candidate per recruiter
commentaireSchema.index({ idAuteur: 1, idRecruteur: 1 }, { unique: true })

module.exports = mongoose.model('Commentaire', commentaireSchema)