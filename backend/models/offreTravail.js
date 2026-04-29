const mongoose = require('mongoose')

// Optional demographic targeting set by the recruiter.
// Empty genres array = no gender restriction.
// Null / 0 ageMin / ageMax = no age restriction.
const filtresPersonnelsSchema = new mongoose.Schema({
  ageMin : { type: Number, min: 16, max: 99, default: null },
  ageMax : { type: Number, min: 16, max: 99, default: null },
  // e.g. [] = everyone,  ['homme'] = men only,  ['homme','femme'] = men and women
  genres : {
    type    : [{ type: String, enum: ['homme', 'femme', 'autre', 'nonSpecifie'] }],
    default : []
  }
}, { _id: false })

const offreSchema = new mongoose.Schema({
  titre           : { type: String, required: true },
  description     : String,
  localisation    : String,
  typeContrat     : { type: String, enum: ['CDI', 'CDD', 'stage', 'freelance'] },
  salaireMin      : Number,
  salaireMax      : Number,
  datePublication : { type: Date, default: Date.now },
  statutOffre     : { type: String, enum: ['ouvert', 'fermer'], default: 'ouvert' },
  requis          : [String],
  idRecruteur     : {
    type    : mongoose.Schema.Types.ObjectId,
    ref     : 'Utilisateur',
    required: true
  },
  filtresPersonnels: { type: filtresPersonnelsSchema, default: () => ({}) }
})

module.exports = mongoose.model('OffreTravail', offreSchema)