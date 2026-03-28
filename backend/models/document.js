const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  nomFichier: String,
  formatFichier: String,
  taille: Number,
  dateUpload: { type: Date, default: Date.now },
type: { 
    type: String, 
    enum: ['cv', 'docsupp', 'docrecruteur'],
    lowercase: true,
    trim: true      
  },

  // if cv
  resume: String,
  derniereMisAjour: Date,

  // if cv or docSupp
  idCandidat: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
  typeFichier: String,

  // if docRecruteur
  idRecruteur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur' },
  typeDocument: String,
  estVerifie: { type: Boolean, default: false },
  dateVerifie: Date
})

module.exports = mongoose.model('Document', documentSchema)