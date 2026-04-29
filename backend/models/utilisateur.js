const mongoose = require('mongoose')

const adresseSchema = new mongoose.Schema({
  numeroRue     : String,
  nomRue        : String,
  complementAdrs: String,
  codePostal    : String,
  ville         : String,
  region        : String,
  pays          : String
})

const preferenceSchema = new mongoose.Schema({
  salaireMinSouhaite     : Number,
  typesContratSouhaite   : [String],
  secteursSouhaites      : [String],
  localisationsSouhaitees: [String],
  disponibilite          : Date
})

const utilisateurSchema = new mongoose.Schema({
  email      : { type: String, required: true, unique: true },
  motDePasse : { type: String, required: true },
  telephone  : String,
  photoProfil: String,
  dateCreation: { type: Date, default: Date.now },
  role: { type: String, enum: ['admin', 'recruteur', 'candidat'], required: true },

  // candidat-specific
  nom          : String,
  prenom       : String,
  statusCompte : { type: String, enum: ['actif', 'bloque'] },
  dateNaissance: Date,
  genre        : {
    type    : String,
    enum    : ['homme', 'femme', 'nonSpecifie'],
    default : 'nonSpecifie'
  },
  bio          : String,
  adresse      : adresseSchema,
  preference   : preferenceSchema,
  idCv         : { type: mongoose.Schema.Types.ObjectId, ref: 'CV' },

  // recruteur-specific
  nomEntreprise        : String,
  descriptionEntreprise: String,
  secteurActivite      : String,
  etatValidation: {
    type: String,
    enum: ['enAttente', 'valideParIA', 'valideParAdmin', 'refuse']
  },
  motifRefus: { type: String, default: null }
})

module.exports = mongoose.model('Utilisateur', utilisateurSchema)