/**
 * verification.service.js
 *
 * Uses Gemini 1.5 Flash to analyse recruiter-uploaded documents.
 * Supported input formats: PDF, JPEG, PNG, WEBP.
 *
 * Returns a structured verdict that is stored on the Document record
 * and used to automatically advance the recruiter's etatValidation.
 */

const mongoose = require('mongoose')
const { GridFSBucket } = require('mongodb')
const { model: geminiModel } = require('../config/gemini')
const Document    = require('../models/Document')
const Utilisateur = require('../models/Utilisateur')
const { createNotification } = require('../utils/notification')

// ── Prompt ────────────────────────────────────────────────────────────────────
// We ask Gemini to respond ONLY with a JSON object — no markdown fences, no prose.
const buildPrompt = (claimedType) => `
You are a document verification expert for an Algerian B2B recruitment platform.
Your job is to determine whether an uploaded file is a LEGITIMATE, READABLE business or identity document.

The uploader claims this document is: "${claimedType || 'unknown'}".

Analyse the document carefully and respond ONLY with a valid JSON object — no markdown, no explanation outside the JSON.

Use this exact schema:
{
  "verdict": "approuve" | "rejete" | "necessiteRevision",
  "confidence": <integer 0-100>,
  "typeDetecte": "<detected document type in French, e.g. Registre du Commerce, Carte Nationale d'Identité, NIF, Statuts de société, Facture, unknown>",
  "raison": "<one clear sentence in French explaining the verdict>",
  "flags": ["<flag1>", "<flag2>"]
}

Verdict rules:
- "approuve":           The document is clearly a real, readable, unaltered official document relevant to proving business legitimacy or identity. Confidence must be >= 70.
- "rejete":             The file is obviously NOT a valid document (random photo, blank page, meme, screenshot of a website, clearly fake/edited). Confidence must be >= 60.
- "necessiteRevision":  You can see it's some kind of document but cannot confirm authenticity (blurry, partially cut off, expired, wrong country, unrecognised format). Use this when unsure.

Flag vocabulary (add as many as apply, keep them as short snake_case strings):
- document_illisible      (cannot read text)
- document_flou           (blurry/low quality)
- document_expire         (clearly past expiry date)
- document_coupe          (edges cut off, key info missing)
- document_modifie        (signs of digital editing/tampering)
- mauvais_type            (type doesn't match the claimed type)
- pas_un_document         (not a document at all)
- informations_manquantes (key fields absent)
- langue_incorrecte       (document not in Arabic, French, or English)
- document_etranger       (foreign document, may need additional checks)

Respond with ONLY the JSON object. No other text.
`.trim()

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Stream a GridFS file into a Buffer */
const streamToBuffer = (readStream) =>
  new Promise((resolve, reject) => {
    const chunks = []
    readStream.on('data',  chunk => chunks.push(chunk))
    readStream.on('end',   ()    => resolve(Buffer.concat(chunks)))
    readStream.on('error', err   => reject(err))
  })

/** Map a file's MIME type to the inlineData mimeType Gemini accepts */
const toGeminiMime = (mime) => {
  const map = {
    'application/pdf':    'application/pdf',
    'image/jpeg':         'image/jpeg',
    'image/jpg':          'image/jpeg',
    'image/png':          'image/png',
    'image/webp':         'image/webp',
  }
  return map[mime?.toLowerCase()] || null
}

/** Parse Gemini's text response — strip any accidental markdown fences */
const parseGeminiResponse = (text) => {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g,       '')
    .trim()
  return JSON.parse(cleaned)
}

// ── Main verification function ────────────────────────────────────────────────

/**
 * verifyDocument(documentId)
 *
 * 1. Loads the Document record from MongoDB
 * 2. Fetches the file bytes from GridFS
 * 3. Sends to Gemini 1.5 Flash
 * 4. Saves the AI verdict on the Document
 * 5. Updates the Recruiter's etatValidation
 * 6. Sends a notification to the recruiter
 *
 * Can be called after upload OR triggered manually by admin.
 */
const verifyDocument = async (documentId) => {
  // ── 1. Load document ───────────────────────────────────────────────────────
  const doc = await Document.findById(documentId)
  if (!doc) throw new Error(`Document ${documentId} not found`)
  if (doc.type !== 'docrecruteur')
    throw new Error('Only recruiter documents are verified by AI')

  // Guard against concurrent calls
  if (doc.verificationEnCours) {
    console.log(`[Verification] Document ${documentId} already being processed — skipping`)
    return
  }

  await Document.findByIdAndUpdate(documentId, { verificationEnCours: true })

  try {
    // ── 2. Fetch file from GridFS ────────────────────────────────────────────
    const db     = mongoose.connection.db
    const bucket = new GridFSBucket(db, { bucketName: 'documents' })
    const stream = bucket.openDownloadStream(doc.fileId)
    const buffer = await streamToBuffer(stream)

    const geminiMime = toGeminiMime(doc.formatFichier)
    if (!geminiMime) {
      throw new Error(`Unsupported file format for AI verification: ${doc.formatFichier}`)
    }

    console.log(`[Verification] Sending ${doc.nomFichier} (${geminiMime}) to Gemini…`)

    // ── 3. Call Gemini 1.5 Flash ─────────────────────────────────────────────
    const prompt = buildPrompt(doc.typeDocument)

    const result = await geminiModel.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: geminiMime,
          data:     buffer.toString('base64'),
        },
      },
    ])

    const rawText = result.response.text()
    console.log(`[Verification] Raw Gemini response: ${rawText}`)

    let parsed
    try {
      parsed = parseGeminiResponse(rawText)
    } catch {
      // If Gemini doesn't return valid JSON, flag for manual review
      parsed = {
        verdict:     'necessiteRevision',
        confidence:  0,
        typeDetecte: 'unknown',
        raison:      'La réponse IA était invalide. Révision manuelle requise.',
        flags:       ['erreur_ia'],
      }
    }

    // Clamp confidence to 0-100
    parsed.confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 0))

    // ── 4. Save AI result on document ────────────────────────────────────────
    const aiVerification = {
      verdict:          parsed.verdict,
      confidence:       parsed.confidence,
      typeDetecte:      parsed.typeDetecte || 'unknown',
      raison:           parsed.raison      || '',
      flags:            Array.isArray(parsed.flags) ? parsed.flags : [],
      dateVerification: new Date(),
      modelUtilise:     'gemini-1.5-flash',
    }

    await Document.findByIdAndUpdate(documentId, {
      aiVerification,
      verificationEnCours: false,
    })

    console.log(`[Verification] ✅ Document ${documentId}: verdict=${parsed.verdict}, confidence=${parsed.confidence}%`)

    // ── 5. Update recruiter etatValidation ───────────────────────────────────
    if (!doc.idRecruteur) return aiVerification

    const recruteur = await Utilisateur.findById(doc.idRecruteur)
    if (!recruteur) return aiVerification

    let nouveauStatut    = null
    let notifContenu     = ''

    if (parsed.verdict === 'approuve' && parsed.confidence >= 70) {
      // Pass to admin queue
      nouveauStatut = 'valideParIA'
      notifContenu  = `✅ Votre document "${doc.nomFichier}" a été validé par notre système IA (${parsed.confidence}% de confiance). Un administrateur va maintenant finaliser la validation de votre compte.`
    } else if (parsed.verdict === 'rejete' && parsed.confidence >= 60) {
      // Reject outright — recruiter needs to re-upload
      nouveauStatut = 'refuse'
      notifContenu  = `❌ Votre document "${doc.nomFichier}" a été rejeté par notre système IA. Raison : ${parsed.raison}. Veuillez soumettre un document valide.`
    } else {
      // Needs manual admin review — leave in enAttente but update notif
      notifContenu  = `⚠️ Votre document "${doc.nomFichier}" nécessite une vérification manuelle. Raison : ${parsed.raison}.`
    }

    if (nouveauStatut) {
      await Utilisateur.findByIdAndUpdate(doc.idRecruteur, {
        etatValidation: nouveauStatut,
      })
    }

    await createNotification({
      idUtilisateur: doc.idRecruteur,
      contenu:       notifContenu,
    })

    return aiVerification
  } catch (err) {
    // Always clear the lock even on failure
    await Document.findByIdAndUpdate(documentId, { verificationEnCours: false })
    console.error(`[Verification] ❌ Error verifying document ${documentId}:`, err.message)
    throw err
  }
}

module.exports = { verifyDocument }