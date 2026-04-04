const axios = require('axios');
const Match = require('../models/Match');
const Utilisateur = require('../models/Utilisateur');
const OffreTravail = require('../models/OffreTravail');
const Candidature = require('../models/Candidature');
const { createNotification } = require('../utils/notification');

/**
 * Helper to call the Python AI Service
 * Ensure your FastAPI/Flask server is running on port 8000
 */
const callAI = async (cvText, jobText) => {
  try {
    const response = await axios.post('http://localhost:8000/match', {
      cv_text: cvText,
      job_text: jobText
    });
    // Safely return score, defaulting to 0 if not found
    return response.data.final_match_score ?? 0; 
  } catch (error) {
    console.error("AI Service Error:", error.message);
    throw new Error("AI Matching service is currently unavailable.");
  }
};

/**
 * GET /api/match/recommandations
 * Returns all open jobs sorted by how well they match the user's CV text
 */
const getRecommandations = async (req, res) => {
  try {
    const candidat = await Utilisateur.findById(req.user._id).populate('idCv')

    if (!candidat?.idCv)
      return res.status(400).json({ error: 'CV not found. Please upload your CV first.' })

    const cvText = candidat.idCv.resume
    if (!cvText || cvText.trim().length < 50)
      return res.status(400).json({ error: 'CV content too short or unreadable. Try re-uploading.' })

    // find offers the candidat has NO match record and NO candidature for
    const [existingMatches, existingCandidatures] = await Promise.all([
      Match.find({ idCandidat: req.user._id }).select('idOffre'),
      Candidature.find({ idCandidat: req.user._id }).select('idOffre')
    ])

    const excludedOffreIds = [
      ...existingMatches.map(m => m.idOffre.toString()),
      ...existingCandidatures.map(c => c.idOffre.toString())
    ]

    const offres = await OffreTravail.find({
      statutOffre: 'ouvert',
      _id: { $nin: excludedOffreIds }
    }).populate('idRecruteur', 'nomEntreprise secteurActivite')

    if (offres.length === 0)
      return res.json({ match: null, message: 'No new offers to suggest.' })

    // score all unseen offers in parallel
    const scored = await Promise.all(
      offres.map(async (offre) => {
        const jobText = `Title: ${offre.titre}. Description: ${offre.description}. Requirements: ${offre.requis?.join(', ')}`
        const score   = await callAI(cvText, jobText)
        return { offre, score }
      })
    )

    // pick the single best one
    scored.sort((a, b) => b.score - a.score)
    const best = scored[0]

    // save to Match so it never gets suggested again
    await Match.create({
      idCandidat:  req.user._id,
      idOffre:     best.offre._id,
      score:       best.score,
      dateCalcul:  new Date()
    })

    res.json({
      match: {
        offre:      best.offre,
        matchScore: Math.round(best.score * 100)
      }
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

/**
 * GET /api/match/score/:offreId
 * Manually trigger or get a score for a specific job page
 */
const getScoreForOffre = async (req, res) => {
  try {
    const candidat = await Utilisateur.findById(req.user._id).populate('idCv');
    if (!candidat.idCv?.resume) {
      return res.status(400).json({ error: 'Please upload a readable CV first.' });
    }

    const offre = await OffreTravail.findById(req.params.offreId);
    if (!offre) return res.status(404).json({ error: 'Offer not found' });

    const jobText = `${offre.titre} ${offre.description} ${offre.requis?.join(' ')}`;
    const score = await callAI(candidat.idCv.resume, jobText);

    const matchRecord = await Match.findOneAndUpdate(
      { idCandidat: req.user._id, idOffre: offre._id },
      { score, dateCalcul: new Date() },
      { upsert: true, new: true }
    );

    res.json({ 
      matchScore: Math.round(score * 100), 
      offreId: offre._id,
      updatedAt: matchRecord.dateCalcul
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/match/apply/:offreId
 * Application flow specifically for "Matched" applications
 */
const applyWithMatch = async (req, res) => {
  try {
    const candidat = await Utilisateur.findById(req.user._id).populate('idCv');
    if (!candidat.idCv?.resume) {
      return res.status(400).json({ error: 'Your CV text is missing. Please re-upload your CV.' });
    }

    const offre = await OffreTravail.findById(req.params.offreId);
    if (!offre) return res.status(404).json({ error: 'Offer not found' });
    if (offre.statutOffre !== 'ouvert') return res.status(400).json({ error: 'This offer is no longer accepting applications.' });

    const existingCandidature = await Candidature.findOne({
      idCandidat: req.user._id,
      idOffre: offre._id
    });
    if (existingCandidature) return res.status(400).json({ error: 'You have already applied to this offer.' });

    // Ensure we have a valid score for this specific application
    let matchRecord = await Match.findOne({ idCandidat: req.user._id, idOffre: offre._id });
    if (!matchRecord) {
      const jobText = `${offre.titre} ${offre.description} ${offre.requis?.join(' ')}`;
      const score = await callAI(candidat.idCv.resume, jobText);
      matchRecord = await Match.create({ idCandidat: req.user._id, idOffre: offre._id, score });
    }

    const candidature = await Candidature.create({
      idCandidat: req.user._id,
      idOffre: offre._id
    });

    // Notify the Recruiter with the matching percentage
    await createNotification({
      idUtilisateur: offre.idRecruteur,
      contenu: `New application received! AI Match Score: ${Math.round(matchRecord.score * 100)}% for "${offre.titre}"`,
      idCandidature: candidature._id
    });

    res.status(201).json({
      message: 'Application successful',
      candidature,
      matchScore: Math.round(matchRecord.score * 100)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getRecommandations, getScoreForOffre, applyWithMatch };