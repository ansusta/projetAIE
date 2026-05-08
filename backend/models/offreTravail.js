// models/OffreTravail.js
const mongoose = require('mongoose');

// Filtres personnels (inchangé)
const filtresPersonnelsSchema = new mongoose.Schema({
  ageMin : { type: Number, min: 16, max: 99, default: null },
  ageMax : { type: Number, min: 16, max: 99, default: null },
  genres : {
    type    : [{ type: String, enum: ['homme', 'femme', 'autre', 'nonSpecifie'] }],
    default : []
  }
}, { _id: false });

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
  filtresPersonnels: { type: filtresPersonnelsSchema, default: () => ({}) },
  // ⭐ NOUVEAU CHAMP : nombre de postes à pourvoir (défaut 1)
  nombrePostes     : { type: Number, default: 1, min: 1 }
});

module.exports = mongoose.model('OffreTravail', offreSchema);