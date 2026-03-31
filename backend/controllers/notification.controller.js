const Notification = require('../models/Notification')

// GET /api/notifications
const mesNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ idUtilisateur: req.user._id })
      .sort({ dateEnvoi: -1 })
      .limit(50)
    res.json(notifications)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/notifications/:id/read
const marquerCommeLu = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id)
    if (!notif) return res.status(404).json({ error: 'Notification not found' })
    if (notif.idUtilisateur.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not your notification' })

    notif.lu = true
    await notif.save()
    res.json(notif)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// PATCH /api/notifications/read-all
const toutMarquerCommeLu = async (req, res) => {
  try {
    await Notification.updateMany({ idUtilisateur: req.user._id, lu: false }, { lu: true })
    res.json({ message: 'All notifications marked as read' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { mesNotifications, marquerCommeLu, toutMarquerCommeLu }