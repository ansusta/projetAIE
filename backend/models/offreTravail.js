const mongoose = require('mongoose')

const offreSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  description: String,
  localisation: String,
  typeContrat: { type: String, enum: ['CDI', 'CDD', 'stage', 'freelance'] },
  salaireMin: Number,
  salaireMax: Number,
  datePublication: { type: Date, default: Date.now },
  statutOffre: { type: String, enum: ['ouvert', 'fermer'], default: 'ouvert' },
  requis: [String],
  idRecruteur: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Utilisateur', 
    required: true 
  }
})

module.exports = mongoose.model('OffreTravail', offreSchema)