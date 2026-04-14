const mongoose = require('mongoose')

// ── Sub-schemas ────────────────────────────────────────────────────────────────

const formationSchema = new mongoose.Schema({
  etablissement : { type: String, required: true },   // school / university
  diplome       : { type: String, required: true },   // degree / certificate
  domaine       : String,                             // field of study
  dateDebut     : Date,
  dateFin       : Date,
  enCours       : { type: Boolean, default: false },
  description   : String                              // optional notes
})

const experienceSchema = new mongoose.Schema({
  poste        : { type: String, required: true },    // job title
  entreprise   : { type: String, required: true },
  localisation : String,
  dateDebut    : Date,
  dateFin      : Date,
  enCours      : { type: Boolean, default: false },
  description  : String                              // responsibilities / achievements
})

const langueSchema = new mongoose.Schema({
  langue : { type: String, required: true },
  niveau : {
    type    : String,
    enum    : ['débutant', 'intermédiaire', 'avancé', 'courant', 'natif'],
    default : 'intermédiaire'
  }
})

// ── Main CV schema ─────────────────────────────────────────────────────────────

const cvSchema = new mongoose.Schema({
  idCandidat : {
    type     : mongoose.Schema.Types.ObjectId,
    ref      : 'Utilisateur',
    required : true,
    unique   : true    // one CV per candidate
  },

  // Header / summary
  titrePoste  : String,   // e.g. "Full-stack Developer"
  resume      : String,   // ← auto-generated plain text used by the AI matcher

  // Sections
  formations   : [formationSchema],
  experiences  : [experienceSchema],
  competences  : [String],   // ["JavaScript", "Node.js", …]
  langues      : [langueSchema],
  loisirs      : [String],   // optional hobbies

  derniereMisAjour : { type: Date, default: Date.now }
})

// ── Helper: build the plain-text blob the AI service reads ────────────────────

cvSchema.methods.buildResumeText = function () {
  const lines = []

  if (this.titrePoste) lines.push(`Poste souhaité : ${this.titrePoste}`)

  if (this.experiences?.length) {
    lines.push(' EXPÉRIENCES ')
    for (const e of this.experiences) {
      const period = e.enCours
        ? `${fmt(e.dateDebut)} – présent`
        : `${fmt(e.dateDebut)} – ${fmt(e.dateFin)}`
      lines.push(`${e.poste} chez ${e.entreprise} (${period})`)
      if (e.localisation) lines.push(`  Lieu : ${e.localisation}`)
      if (e.description)  lines.push(`  ${e.description}`)
    }
  }

  if (this.formations?.length) {
    lines.push(' FORMATIONS ')
    for (const f of this.formations) {
      const period = f.enCours
        ? `${fmt(f.dateDebut)} – présent`
        : `${fmt(f.dateDebut)} – ${fmt(f.dateFin)}`
      lines.push(`${f.diplome}${f.domaine ? ' en ' + f.domaine : ''} – ${f.etablissement} (${period})`)
      if (f.description) lines.push(`  ${f.description}`)
    }
  }

  if (this.competences?.length)
    lines.push(` COMPÉTENCES ${this.competences.join(', ')}`)

  if (this.langues?.length) {
    lines.push(' LANGUES ')
    for (const l of this.langues) lines.push(`${l.langue} – ${l.niveau}`)
  }

  return lines.join('\n')
}

// Regenerate resume text automatically before every save
// Regenerate resume text automatically before every save
cvSchema.pre('save', function () {
  this.resume           = this.buildResumeText()
  this.derniereMisAjour = new Date()
}) // <-- Look ma, no next()!

// ─────────────────────────────────────────────────────────────────────────────

function fmt (date) {
  if (!date) return '?'
  return new Date(date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

module.exports = mongoose.model('CV', cvSchema)