const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  contenu: { type: String, required: true },
  dateEnvoi: { type: Date, default: Date.now },
  lu: { type: Boolean, default: false },
  idUtilisateur: { type: mongoose.Schema.Types.ObjectId, ref: 'Utilisateur', required: true },
  idCandidature: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidature' }
})

module.exports = mongoose.model('Notification', notificationSchema)