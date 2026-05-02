const express = require('express')
const router  = express.Router()
const { getRecommandations, getScoreForOffre, applyWithMatch, getMatchHistory }
  = require('../controllers/match.controller')
const { authenticate, authorize } = require('../middleware/auth.middleware')

router.use(authenticate, authorize('candidat'))
router.get('/history',          getMatchHistory)  
router.get('/recommandations',  getRecommandations)
router.get('/score/:offreId',   getScoreForOffre)
router.post('/apply/:offreId',  applyWithMatch)

module.exports = router