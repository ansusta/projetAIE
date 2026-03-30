const Notification = require('../models/Notification')

const createNotification = async ({ idUtilisateur, contenu, idCandidature = null }) => {
  try {
    await Notification.create({ idUtilisateur, contenu, idCandidature })
  } catch (err) {
    console.error('Notification creation failed:', err.message)
  }
}

module.exports = { createNotification }