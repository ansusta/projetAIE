const axios        = require('axios')
const Match        = require('../models/match')
const Utilisateur  = require('../models/utilisateur')
const OffreTravail = require('../models/offreTravail')
const Candidature  = require('../models/candidature')
const CV           = require('../models/cv')
const { createNotification }      = require('../utils/notification')
const { verifierFiltrePersonnel } = require('../utils/filtrePersonnel')

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
// Helper — load candidate with CV text + personal info for filtering
// ─────────────────────────────────────────────────────────────────────────────
const getCandidatAvecCV = async (userId) => {
  const candidat = await Utilisateur.findById(userId).populate('idCv')

  if (!candidat?.idCv)
    throw { status: 400, message: 'CV not found. Please fill in your CV first.' }

  const cvText = candidat.idCv.resume
  if (!cvText || cvText.trim().length < 30)
    throw { status: 400, message: 'Your CV has too little information. Please complete it.' }

  return { candidat, cvText }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/match/recommandations
// Silently skips offers whose personal filters the candidate doesn't meet.
// ─────────────────────────────────────────────────────────────────────────────
const getRecommandations = async (req, res) => {
  try {
    let candidat, cvText
    try {
      ({ candidat, cvText } = await getCandidatAvecCV(req.user._id))
    } catch (e) {
      return res.status(e.status || 500).json({ error: e.message })
    }

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

    // ── Pre-AI filter: remove offers whose personal filters don't match ───────
    const offresEligibles = offres.filter(offre => {
      const { passe } = verifierFiltrePersonnel(candidat, offre)
      return passe
    })

    if (offresEligibles.length === 0)
      return res.json({ match: null, message: 'No new offers to suggest.' })

    // ── AI scoring on eligible offers only ────────────────────────────────────
    const scored = await Promise.all(
      offresEligibles.map(async (offre) => {
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
// Returns AI score + whether the candidate passes the personal filter.
// ─────────────────────────────────────────────────────────────────────────────
const getScoreForOffre = async (req, res) => {
  try {
    let candidat, cvText
    try {
      ({ candidat, cvText } = await getCandidatAvecCV(req.user._id))
    } catch (e) {
      return res.status(e.status || 500).json({ error: e.message })
    }

    const offre = await OffreTravail.findById(req.params.offreId)
    if (!offre) return res.status(404).json({ error: 'Offer not found' })

    // Check personal filter — inform the frontend but don't block
    const filtreResult = verifierFiltrePersonnel(candidat, offre)

    const jobText = `${offre.titre} ${offre.description} ${offre.requis?.join(' ')}`
    const score   = await callAI(cvText, jobText)

    const matchRecord = await Match.findOneAndUpdate(
      { idCandidat: req.user._id, idOffre: offre._id },
      { score, dateCalcul: new Date() },
      { upsert: true, new: true }
    )

    res.json({
      matchScore        : Math.round(score * 100),
      offreId           : offre._id,
      updatedAt         : matchRecord.dateCalcul,
      // Let the frontend decide how to surface this
      filtrePersonnel   : {
        passe  : filtreResult.passe,
        raison : filtreResult.passe ? null : filtreResult.raison
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/match/apply/:offreId
// Blocks application when personal filter not met.
// ─────────────────────────────────────────────────────────────────────────────
const applyWithMatch = async (req, res) => {
  try {
    let candidat, cvText
    try {
      ({ candidat, cvText } = await getCandidatAvecCV(req.user._id))
    } catch (e) {
      return res.status(e.status || 500).json({ error: e.message })
    }

    const offre = await OffreTravail.findById(req.params.offreId)
    if (!offre) return res.status(404).json({ error: 'Offer not found' })
    if (offre.statutOffre !== 'ouvert')
      return res.status(400).json({ error: 'This offer is no longer accepting applications.' })

    const existing = await Candidature.findOne({ idCandidat: req.user._id, idOffre: offre._id })
    if (existing) return res.status(400).json({ error: 'You have already applied to this offer.' })

    // ── Personal filter check ─────────────────────────────────────────────────
    const filtreResult = verifierFiltrePersonnel(candidat, offre)
    if (!filtreResult.passe) {
      return res.status(403).json({
        error          : filtreResult.raison,
        filtreEchoue   : true
      })
    }

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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/match/history
// Returns all past AI matches for the candidate, sorted newest first.
// Each entry includes the offer details, score, date, and whether the
// candidate has already applied (so the frontend can show the right CTA).
// ─────────────────────────────────────────────────────────────────────────────
const getMatchHistory = async (req, res) => {
  try {
    const [matches, candidatures] = await Promise.all([
      Match.find({ idCandidat: req.user._id })
        .sort({ dateCalcul: -1 })
        .populate({
          path    : 'idOffre',
          populate : { path: 'idRecruteur', select: 'nomEntreprise secteurActivite' }
        }),
      Candidature.find({ idCandidat: req.user._id }).select('idOffre')
    ])

    const appliedOffreIds = new Set(candidatures.map(c => c.idOffre.toString()))

    const history = matches
      // Drop entries whose offer was deleted
      .filter(m => m.idOffre)
      .map(m => ({
        matchId    : m._id,
        offre      : m.idOffre,
        matchScore : Math.round(m.score * 100),
        dateCalcul : m.dateCalcul,
        applied    : appliedOffreIds.has(m.idOffre._id.toString()),
        // Surface whether the offer is still open so the UI can disable the CTA
        ouvert     : m.idOffre.statutOffre === 'ouvert'
      }))

    res.json({ history })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { getRecommandations, getScoreForOffre, applyWithMatch, getMatchHistory }