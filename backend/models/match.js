const mongoose = require('mongoose')

const matchSchema = new mongoose.Schema({
  idCandidat: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  idOffre: { type: mongoose.Schema.Types.ObjectId, ref: 'OffreTravail', required: true },
  score: Number,
  dateCalcul: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Match', matchSchema)