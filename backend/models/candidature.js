const mongoose = require('mongoose')

const entretienSchema = new mongoose.Schema({
  dateEntretien: Date,
  statut: String,
  feedbackRecruteur: String
})

const candidatureSchema = new mongoose.Schema({
  dateCandidature: { type: Date, default: Date.now },
  etatCandidature: { 
    type: String, 
    enum: ['Recue', 'demandeDocSupp', 'convocationEntretien', 'Embauchee', 'refusee'],
    default: 'Recue'
  },
  idCandidat: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  idOffre: { type: mongoose.Schema.Types.ObjectId, ref: 'OffreTravail', required: true },
  entretien: entretienSchema
})

module.exports = mongoose.model('Candidature', candidatureSchema)