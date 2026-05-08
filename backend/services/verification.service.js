/**
 * verification.service.js
 *
 * Uses Gemini Flash to analyse recruiter-uploaded documents.
 * Supported input formats: PDF, JPEG, PNG, WEBP.
 *
 * FIX: AI never automatically refuses a recruiter.
 * All final decisions (approve/refuse) are now made by an admin.
 */

const mongoose = require('mongoose')
const { GridFSBucket } = require('mongodb')
const { model: geminiModel } = require('../config/gemini')
const Document    = require('../models/document')
const Utilisateur = require('../models/utilisateur')
const { createNotification } = require('../utils/notification')

// ── Prompt ────────────────────────────────────────────────────────────────────
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

const streamToBuffer = (readStream) =>
  new Promise((resolve, reject) => {
    const chunks = []
    readStream.on('data',  chunk => chunks.push(chunk))
    readStream.on('end',   ()    => resolve(Buffer.concat(chunks)))
    readStream.on('error', err   => reject(err))
  })

const toGeminiMime = (mime) => {
  const map = {
    'application/pdf': 'application/pdf',
    'image/jpeg':      'image/jpeg',
    'image/jpg':       'image/jpeg',
    'image/png':       'image/png',
    'image/webp':      'image/webp',
  }
  return map[mime?.toLowerCase()] || null
}

const parseGeminiResponse = (text) => {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g,      '')
    .trim()
  return JSON.parse(cleaned)
}

// ── Main verification function ────────────────────────────────────────────────
const verifyDocument = async (documentId) => {
  // ── 1. Load document ───────────────────────────────────────────────────────
  const doc = await Document.findById(documentId)
  if (!doc) throw new Error(`Document ${documentId} not found`)
  if (doc.type !== 'docrecruteur')
    throw new Error('Only recruiter documents are verified by AI')

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
    if (!geminiMime)
      throw new Error(`Unsupported file format for AI verification: ${doc.formatFichier}`)

    console.log(`[Verification] Sending ${doc.nomFichier} (${geminiMime}) to Gemini…`)

    // ── 3. Call Gemini ───────────────────────────────────────────────────────
    const result = await geminiModel.generateContent([
      buildPrompt(doc.typeDocument),
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
      parsed = {
        verdict:     'necessiteRevision',
        confidence:  0,
        typeDetecte: 'unknown',
        raison:      'La réponse IA était invalide. Révision manuelle requise.',
        flags:       ['erreur_ia'],
      }
    }

    parsed.confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 0))

    // ── 4. Save AI result on document ────────────────────────────────────────
    const aiVerification = {
      verdict:          parsed.verdict,
      confidence:       parsed.confidence,
      typeDetecte:      parsed.typeDetecte || 'unknown',
      raison:           parsed.raison      || '',
      flags:            Array.isArray(parsed.flags) ? parsed.flags : [],
      dateVerification: new Date(),
      modelUtilise:     'gemini-2.5-flash',
    }

    await Document.findByIdAndUpdate(documentId, {
      aiVerification,
      verificationEnCours: false,
    })

    console.log(`[Verification] ✅ Document ${documentId}: verdict=${parsed.verdict}, confidence=${parsed.confidence}%`)

    // ── 5. Update recruiter etatValidation (but never auto‑refuse) ───────────
    if (!doc.idRecruteur) return aiVerification

    const recruteur = await Utilisateur.findById(doc.idRecruteur)
    if (!recruteur) return aiVerification

    // Never touch a recruiter already validated by a human admin
    if (recruteur.etatValidation === 'valideParAdmin') {
      console.log(`[Verification] Recruiter ${doc.idRecruteur} already admin-validated — skipping status update`)
      return aiVerification
    }

    let nouveauStatut = null
    let notifContenu  = ''

    if (parsed.verdict === 'approuve' && parsed.confidence >= 70) {
      // Good document: ensure recruiter is in admin queue (valideParIA)
      if (recruteur.etatValidation !== 'valideParAdmin') {
        nouveauStatut = 'valideParIA'
      }
      notifContenu = `✅ Votre document "${doc.nomFichier}" a été validé par notre système IA (${parsed.confidence}% de confiance). Un administrateur va maintenant finaliser la validation de votre compte.`
      
    } else if (parsed.verdict === 'rejete' && parsed.confidence >= 60) {
      // ⚠️ AI thinks the document is invalid, but we DO NOT auto-refuse the recruiter.
      // Instead, we put them back into the pending queue (or keep them there)
      // so an admin can review the document and decide.
      
      if (recruteur.etatValidation === 'valideParAdmin') {
        // already admin‑approved – nothing to change
      } else {
        // Force recruiter into the admin queue if not already there
        nouveauStatut = 'enAttente'
      }
      
      notifContenu = `⚠️ Votre document "${doc.nomFichier}" semble poser problème (${parsed.raison}). Un administrateur va examiner votre dossier manuellement.`
      
    } else {
      // 'necessiteRevision' or low confidence
      if (recruteur.etatValidation === 'refuse') {
        // If they were previously refused but just uploaded new documents,
        // bring them back to pending so admin sees them again.
        nouveauStatut = 'enAttente'
      } else if (recruteur.etatValidation !== 'valideParAdmin') {
        // Ensure they are in the queue
        nouveauStatut = 'enAttente'
      }
      notifContenu = `ℹ️ Votre document "${doc.nomFichier}" nécessite une vérification manuelle. Raison : ${parsed.raison}.`
    }

    // Apply status change if needed (never set to 'refuse' automatically)
    if (nouveauStatut && nouveauStatut !== 'refuse') {
      await Utilisateur.findByIdAndUpdate(doc.idRecruteur, {
        etatValidation: nouveauStatut,
        $unset: { motifRefus: "" }   // clear any old refusal reason
      })
    }

    // Always send a notification
    await createNotification({
      idUtilisateur: doc.idRecruteur,
      contenu:       notifContenu,
    })

    return aiVerification

  } catch (err) {
    await Document.findByIdAndUpdate(documentId, { verificationEnCours: false })
    console.error(`[Verification] ❌ Error verifying document ${documentId}:`, err.message)
    throw err
  }
}

module.exports = { verifyDocument }