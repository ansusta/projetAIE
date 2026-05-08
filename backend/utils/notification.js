const Notification = require('../models/notification')

const createNotification = async ({ idUtilisateur, contenu, idCandidature = null }) => {
  try {
    await Notification.create({ idUtilisateur, contenu, idCandidature })
  } catch (err) {
    console.error('Notification creation failed:', err.message)
  }
}

module.exports = { createNotification }