const express = require('express')
const router  = express.Router()
const { mesNotifications, marquerCommeLu, toutMarquerCommeLu }
  = require('../controllers/notification.controller')
const { authenticate } = require('../middleware/auth.middleware')

router.use(authenticate) // all protected

// ⚠️  read-all BEFORE /:id
router.get('/',            mesNotifications)
router.patch('/read-all',  toutMarquerCommeLu)
router.patch('/:id/read',  marquerCommeLu)

module.exports = router