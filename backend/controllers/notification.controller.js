const Notification = require('../models/notification')

// GET /api/notifications
const mesNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ idUtilisateur: req.user._id })
      .sort({ dateEnvoi: -1 })
      // ✅ Populate idCandidature → idOffre pour avoir le titre dans la notif
      .populate({
        path: 'idCandidature',
        select: 'etatCandidature dateCandidature idOffre',
        populate: {
          path:   'idOffre',
          select: 'titre localisation typeContrat statutOffre'
        }
      })
      // ✅ Populate idOffre direct (pour les notifs sans candidature)
      .populate('idOffre', 'titre localisation typeContrat statutOffre')
      .lean()

    res.json(notifs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/notifications/:id/read
const marquerCommeLu = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, idUtilisateur: req.user._id },
      { lu: true }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/notifications/read-all
const toutMarquerCommeLu = async (req, res) => {
  try {
    await Notification.updateMany(
      { idUtilisateur: req.user._id, lu: false },
      { lu: true }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { mesNotifications, marquerCommeLu, toutMarquerCommeLu }