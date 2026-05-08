const CV          = require('../models/cv')
const Utilisateur = require('../models/utilisateur')

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cv
// Create or fully replace the candidate's CV
// ─────────────────────────────────────────────────────────────────────────────
const creerOuRemplacerCV = async (req, res) => {
  console.log("\n[CHECKPOINT 1] 🚦 Entered creerOuRemplacerCV controller");
  debugger;
  try {
    console.log(`[CHECKPOINT 2] 👤 req.user._id is: ${req.user?._id}`);
    const { titrePoste, formations, experiences, competences, langues, loisirs } = req.body

    // Remove any previous CV for this candidate
    console.log("[CHECKPOINT 3] 🗑️ About to run CV.deleteOne...");
    debugger;
    await CV.deleteOne({ idCandidat: req.user._id })
console.log("[CHECKPOINT 4] ✅ CV.deleteOne succeeded");
console.log("[CHECKPOINT 5] 📝 About to run CV.create...");
    console.log("[DEBUG BODY] req.body is:", req.body);
    debugger;
    const cv = await CV.create({
      
      idCandidat  : req.user._id,
      titrePoste,
      formations  : formations  || [],
      experiences : experiences || [],
      competences : competences || [],
      langues     : langues     || [],
      loisirs     : loisirs     || []
    })

    console.log("[CHECKPOINT 7] 🔗 About to run Utilisateur.findByIdAndUpdate...");
    debugger;
    // Keep the reference on the user document
    await Utilisateur.findByIdAndUpdate(req.user._id, { idCv: cv._id })
console.log("[CHECKPOINT 8] ✅ Utilisateur updated successfully");

    console.log("[CHECKPOINT 9] 🚀 Sending success response...");
    res.status(201).json(cv)
  } catch (err) {
    console.log("\n[💥 CRASH] Error caught in catch block!");
    console.error("=== FULL ERROR TRACE ===");
    console.error(err.stack);
    console.error("========================\n");
    debugger;
    res.status(500).json({ error: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cv/me
// Fetch the authenticated candidate's own CV
// ─────────────────────────────────────────────────────────────────────────────
const getMonCV = async (req, res) => {
  try {
    const cv = await CV.findOne({ idCandidat: req.user._id })
    if (!cv) return res.status(404).json({ error: 'No CV found. Please create one.' })
    res.json(cv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/cv
// Partial update — only the fields sent in the body are updated
// ─────────────────────────────────────────────────────────────────────────────
const mettreAJourCV = async (req, res) => {
  try {
    const allowed = ['titrePoste', 'formations', 'experiences', 'competences', 'langues', 'loisirs']
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ error: 'No valid fields to update.' })

    // Load → mutate → save  (so the pre-save hook re-generates resume text)
    const cv = await CV.findOne({ idCandidat: req.user._id })
    if (!cv) return res.status(404).json({ error: 'No CV found. Please create one first.' })

    Object.assign(cv, updates)
    await cv.save()

    res.json(cv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/cv
// ─────────────────────────────────────────────────────────────────────────────
const supprimerCV = async (req, res) => {
  try {
    const cv = await CV.findOneAndDelete({ idCandidat: req.user._id })
    if (!cv) return res.status(404).json({ error: 'No CV to delete.' })

    // Remove the reference from the user
    await Utilisateur.findByIdAndUpdate(req.user._id, { idCv: null })

    res.json({ message: 'CV deleted successfully.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cv/:candidatId   (recruiter / admin — public CV view)
// ─────────────────────────────────────────────────────────────────────────────
const getCVPublic = async (req, res) => {
  try {
    const cv = await CV.findOne({ idCandidat: req.params.candidatId })
      .populate('idCandidat', 'nom prenom email photoProfil')
    if (!cv) return res.status(404).json({ error: 'CV not found.' })
    res.json(cv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


// ─── Section helpers (add / remove a single item) ────────────────────────────

// POST /api/cv/experience
const ajouterExperience = async (req, res) => {
  try {
    const cv = await CV.findOne({ idCandidat: req.user._id })
    if (!cv) return res.status(404).json({ error: 'No CV found. Create one first.' })

    cv.experiences.push(req.body)
    await cv.save()
    res.status(201).json(cv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE /api/cv/experience/:expId
const supprimerExperience = async (req, res) => {
  try {
    const cv = await CV.findOne({ idCandidat: req.user._id })
    if (!cv) return res.status(404).json({ error: 'No CV found.' })

    cv.experiences = cv.experiences.filter(e => e._id.toString() !== req.params.expId)
    await cv.save()
    res.json(cv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// POST /api/cv/formation
const ajouterFormation = async (req, res) => {
  try {
    const cv = await CV.findOne({ idCandidat: req.user._id })
    if (!cv) return res.status(404).json({ error: 'No CV found. Create one first.' })

    cv.formations.push(req.body)
    await cv.save()
    res.status(201).json(cv)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// DELETE /api/cv/formation/:formId
// DELETE /api/cv/formation/:formId
const supprimerFormation = async (req, res) => {
  try {
    const cv = await CV.findOne({ idCandidat: req.user._id })
    if (!cv) return res.status(404).json({ error: 'No CV found.' })

    // 1. Check if the formation actually exists in the CV
    const formationExists = cv.formations.id(req.params.formId);
    if (!formationExists) {
      return res.status(404).json({ error: 'Formation not found in this CV.' })
    }

    // 2. Remove the formation using Mongoose's .pull() method
    cv.formations.pull(req.params.formId);
    await cv.save()
    
    // 3. Return a standard 200 status with your success message
    res.status(200).json({ message: 'Formation deleted successfully.' })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  creerOuRemplacerCV,
  getMonCV,
  mettreAJourCV,
  supprimerCV,
  getCVPublic,
  ajouterExperience,
  supprimerExperience,
  ajouterFormation,
  supprimerFormation
}