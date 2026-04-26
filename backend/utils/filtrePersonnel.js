/**
 * filtrePersonnel.js
 *
 * Pre-AI demographic filter.
 * Called before any AI scoring or application submission.
 *
 * Rules:
 *  - Age filter is active only when ageMin or ageMax is set (>0).
 *  - Gender filter is active only when offre.filtresPersonnels.genres is non-empty.
 *  - A candidate with dateNaissance = null is treated as age-unknown → fails an active age filter.
 *  - A candidate with genre = 'nonSpecifie' fails an active gender filter
 *    (they haven't disclosed it, so we can't confirm they match).
 *
 * Returns:
 *  { passe: true }
 *  { passe: false, raison: '<human-readable French string>' }
 */

/**
 * Calculate age in full years from a Date object.
 * Returns null if dateNaissance is falsy.
 */
const calculerAge = (dateNaissance) => {
  if (!dateNaissance) return null
  const now       = new Date()
  const naissance = new Date(dateNaissance)
  let age         = now.getFullYear() - naissance.getFullYear()
  const moisPasse = now.getMonth() > naissance.getMonth() ||
    (now.getMonth() === naissance.getMonth() && now.getDate() >= naissance.getDate())
  if (!moisPasse) age--
  return age
}

/**
 * verifierFiltrePersonnel(candidat, offre)
 *
 * @param {Object} candidat  - Mongoose Utilisateur document (must have dateNaissance, genre)
 * @param {Object} offre     - Mongoose OffreTravail document (must have filtresPersonnels)
 * @returns {{ passe: boolean, raison?: string }}
 */
const verifierFiltrePersonnel = (candidat, offre) => {
  const filtres = offre.filtresPersonnels || {}

  // ── Age filter ─────────────────────────────────────────────────────────────
  const ageMin = filtres.ageMin || null
  const ageMax = filtres.ageMax || null

  if (ageMin || ageMax) {
    const age = calculerAge(candidat.dateNaissance)

    if (age === null) {
      return {
        passe : false,
        raison: 'Cette offre requiert une tranche d\'âge spécifique et votre date de naissance n\'est pas renseignée.'
      }
    }

    if (ageMin && age < ageMin) {
      return {
        passe : false,
        raison: `Cette offre est réservée aux candidats de ${ageMin} ans et plus (vous avez ${age} ans).`
      }
    }

    if (ageMax && age > ageMax) {
      return {
        passe : false,
        raison: `Cette offre est réservée aux candidats de ${ageMax} ans maximum (vous avez ${age} ans).`
      }
    }
  }

  // ── Gender filter ──────────────────────────────────────────────────────────
  const genres = filtres.genres || []

  if (genres.length > 0) {
    const genreCandidat = candidat.genre || 'nonSpecifie'

    if (genreCandidat === 'nonSpecifie') {
      return {
        passe : false,
        raison: 'Cette offre cible un genre spécifique. Veuillez renseigner votre genre dans votre profil pour postuler.'
      }
    }

    if (!genres.includes(genreCandidat)) {
      return {
        passe : false,
        raison: 'Cette offre ne correspond pas à vos informations personnelles.'
      }
    }
  }

  return { passe: true }
}

module.exports = { verifierFiltrePersonnel, calculerAge }