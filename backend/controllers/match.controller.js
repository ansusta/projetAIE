const axios        = require('axios')
const Match        = require('../models/Match')
const Utilisateur  = require('../models/Utilisateur')
const OffreTravail = require('../models/OffreTravail')
const Candidature  = require('../models/Candidature')
const CV           = require('../models/CV')                          // ← new import
const { createNotification } = require('../utils/notification')

// ─────────────────────────────────────────────────────────────────────────────
// Helper — call the Python AI service
// ─────────────────────────────────────────────────────────────────────────────
const callAI = async (cvText, jobText) => {
  try {
    const response = await axios.post('http://localhost:8000/match', {
      cv_text  : cvText,
      job_text : jobText
    })
    return response.data.final_match_score ?? 0
  } catch (error) {
    console.error('AI Service Error:', error.message)
    throw new Error('AI Matching service is currently unavailable.')
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — load & validate CV text for a candidate
// ─────────────────────────────────────────────────────────────────────────────
const getCvText = async (userId) => {
  const candidat = await Utilisateur.findById(userId).populate('idCv')
  if (!candidat?.idCv)
    throw { status: 400, message: 'CV not found. Please fill in your CV first.' }

  const cvText = candidat.idCv.resume
  if (!cvText || cvText.trim().length < 30)
    throw { status: 400, message: 'Your CV has too little information. Please complete it.' }

  return cvText
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/match/recommandations
// Returns the single best-matching open job the candidate hasn't seen yet
// ─────────────────────────────────────────────────────────────────────────────
const getRecommandations = async (req, res) => {
  try {
    const cvText = await getCvText(req.user._id).catch(e => {
      return res.status(e.status || 500).json({ error: e.message })
    })
    if (!cvText) return  // response already sent above

    const [existingMatches, existingCandidatures] = await Promise.all([
      Match.find({ idCandidat: req.user._id }).select('idOffre'),
      Candidature.find({ idCandidat: req.user._id }).select('idOffre')
    ])

    const excludedIds = [
      ...existingMatches.map(m => m.idOffre.toString()),
      ...existingCandidatures.map(c => c.idOffre.toString())
    ]

    const offres = await OffreTravail.find({
      statutOffre: 'ouvert',
      _id: { $nin: excludedIds }
    }).populate('idRecruteur', 'nomEntreprise secteurActivite')

    if (offres.length === 0)
      return res.json({ match: null, message: 'No new offers to suggest.' })

    const scored = await Promise.all(
      offres.map(async (offre) => {
        const jobText = `Title: ${offre.titre}. Description: ${offre.description}. Requirements: ${offre.requis?.join(', ')}`
        const score   = await callAI(cvText, jobText)
        return { offre, score }
      })
    )

    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]

    await Match.create({
      idCandidat : req.user._id,
      idOffre    : best.offre._id,
      score      : best.score,
      dateCalcul : new Date()
    })

    res.json({
      match: {
        offre      : best.offre,
        matchScore : Math.round(best.score * 100)
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/match/score/:offreId
// ─────────────────────────────────────────────────────────────────────────────
const getScoreForOffre = async (req, res) => {
  try {
    let cvText
    try { cvText = await getCvText(req.user._id) }
    catch (e) { return res.status(e.status || 500).json({ error: e.message }) }

    const offre = await OffreTravail.findById(req.params.offreId)
    if (!offre) return res.status(404).json({ error: 'Offer not found' })

    const jobText = `${offre.titre} ${offre.description} ${offre.requis?.join(' ')}`
    const score   = await callAI(cvText, jobText)

    const matchRecord = await Match.findOneAndUpdate(
      { idCandidat: req.user._id, idOffre: offre._id },
      { score, dateCalcul: new Date() },
      { upsert: true, new: true }
    )

    res.json({
      matchScore : Math.round(score * 100),
      offreId    : offre._id,
      updatedAt  : matchRecord.dateCalcul
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/match/apply/:offreId
// ─────────────────────────────────────────────────────────────────────────────
const applyWithMatch = async (req, res) => {
  try {
    let cvText
    try { cvText = await getCvText(req.user._id) }
    catch (e) { return res.status(e.status || 500).json({ error: e.message }) }

    const offre = await OffreTravail.findById(req.params.offreId)
    if (!offre) return res.status(404).json({ error: 'Offer not found' })
    if (offre.statutOffre !== 'ouvert')
      return res.status(400).json({ error: 'This offer is no longer accepting applications.' })

    const existing = await Candidature.findOne({ idCandidat: req.user._id, idOffre: offre._id })
    if (existing) return res.status(400).json({ error: 'You have already applied to this offer.' })

    let matchRecord = await Match.findOne({ idCandidat: req.user._id, idOffre: offre._id })
    if (!matchRecord) {
      const jobText = `${offre.titre} ${offre.description} ${offre.requis?.join(' ')}`
      const score   = await callAI(cvText, jobText)
      matchRecord   = await Match.create({ idCandidat: req.user._id, idOffre: offre._id, score })
    }

    const candidature = await Candidature.create({
      idCandidat : req.user._id,
      idOffre    : offre._id
    })

    await createNotification({
      idUtilisateur : offre.idRecruteur,
      contenu       : `New application received! AI Match Score: ${Math.round(matchRecord.score * 100)}% for "${offre.titre}"`,
      idCandidature : candidature._id
    })

    res.status(201).json({
      message    : 'Application successful',
      candidature,
      matchScore : Math.round(matchRecord.score * 100)
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getRecommandations, getScoreForOffre, applyWithMatch }