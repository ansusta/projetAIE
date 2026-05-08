const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  contenu:       { type: String, required: true },
  dateEnvoi:     { type: Date, default: Date.now },
  lu:            { type: Boolean, default: false },
  idUtilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  idCandidature: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidature', default: null },
  // ✅ pour pouvoir afficher le titre de l'offre dans la notif
  idOffre:       { type: mongoose.Schema.Types.ObjectId, ref: 'OffreTravail', default: null },
  // ✅ type pour distinguer les notifications "poste pourvu"
  type: {
    type:    String,
    enum:    ['candidature', 'entretien', 'embauche', 'refus', 'postePourvu', 'general'],
    default: 'general'
  }
})

module.exports = mongoose.model('Notification', notificationSchema)