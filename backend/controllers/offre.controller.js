const OffreTravail = require('../models/offreTravail');

// POST /api/offres
const creerOffre = async (req, res) => {
  try {
    const {
      titre, description, localisation, typeContrat,
      salaireMin, salaireMax, requis,
      filtresPersonnels,
      nombrePostes          // ← Ajout
    } = req.body;

    const offre = await OffreTravail.create({
      titre, description, localisation, typeContrat,
      salaireMin, salaireMax, requis,
      idRecruteur: req.user._id,
      filtresPersonnels: filtresPersonnels || {},
      nombrePostes: nombrePostes || 1   // ← Défaut 1 si absent
    });

    res.status(201).json(offre);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/offres  — public, with filters + pagination
const listerOffres = async (req, res) => {
  try {
    const { typeContrat, localisation, salaireMin, search, page = 1, limit = 10 } = req.query;

    const filter = { statutOffre: 'ouvert' };
    if (typeContrat)  filter.typeContrat  = typeContrat;
    if (localisation) filter.localisation = { $regex: localisation, $options: 'i' };
    if (salaireMin)   filter.salaireMin   = { $gte: Number(salaireMin) };
    if (search)       filter.titre        = { $regex: search, $options: 'i' };

    const total  = await OffreTravail.countDocuments(filter);
    const offres = await OffreTravail.find(filter)
      .populate('idRecruteur', 'nomEntreprise secteurActivite')
      .sort({ datePublication: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ offres, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/offres/mes-offres  — recruteur only
const mesOffres = async (req, res) => {
  try {
    const offres = await OffreTravail.find({ idRecruteur: req.user._id })
      .sort({ datePublication: -1 });
    // Le champ nombrePostes est automatiquement inclus (modèle le possède)
    res.json(offres);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/offres/:id  — public
const getOffre = async (req, res) => {
  try {
    const offre = await OffreTravail.findById(req.params.id)
      .populate('idRecruteur', 'nomEntreprise secteurActivite adresse');
    if (!offre) return res.status(404).json({ error: 'Offer not found' });
    res.json(offre);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/offres/:id  — only the owner recruteur
const modifierOffre = async (req, res) => {
  try {
    const offre = await OffreTravail.findById(req.params.id);
    if (!offre) return res.status(404).json({ error: 'Offer not found' });
    if (offre.idRecruteur.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not your offer' });

    const allowed = [
      'titre', 'description', 'localisation', 'typeContrat',
      'salaireMin', 'salaireMax', 'requis', 'statutOffre',
      'filtresPersonnels', 'nombrePostes'   // ← Ajout
    ];
    allowed.forEach(f => { if (req.body[f] !== undefined) offre[f] = req.body[f]; });

    await offre.save();
    res.json(offre);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/offres/:id  — owner or admin
const supprimerOffre = async (req, res) => {
  try {
    const offre = await OffreTravail.findById(req.params.id);
    if (!offre) return res.status(404).json({ error: 'Offer not found' });

    const isOwner = offre.idRecruteur.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });

    await offre.deleteOne();
    res.json({ message: 'Offer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { creerOffre, listerOffres, mesOffres, getOffre, modifierOffre, supprimerOffre };