const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS file id
  nomFichier: String,
  formatFichier: String,
  taille: Number,
  dateUpload: { type: Date, default: Date.now },
  type: { type: String, enum: ['docSupp', 'docRecruteur'] },

  // if docSupp
  idCandidat: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
  typeFichier: String,

  // if docRecruteur
  idRecruteur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
  typeDocument: String,
  estVerifie: { type: Boolean, default: false },
  dateVerifie: Date
})

module.exports = mongoose.model('Document', documentSchema)