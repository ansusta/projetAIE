const mongoose = require('mongoose')
const { Readable } = require('stream')
const Document = require('../models/document')
const getGridFSBucket = require('../config/gridfs')
const Utilisateur = require('../models/utilisateur')
const { verifyDocument } = require('../services/verification.service')

const pdfParse = require('pdf-extraction')
const mammoth = require('mammoth')

// Helper to get bucket with consistent name
const getDocumentsBucket = () => {
  const bucket = getGridFSBucket()
  // If your getGridFSBucket already sets bucketName = 'documents', fine.
  // Otherwise, force it here:
  if (!bucket.s.options.bucketName) {
    // This is a workaround; better to fix in gridfs.js
    const db = mongoose.connection.db
    return new mongoose.mongo.GridFSBucket(db, { bucketName: 'documents' })
  }
  return bucket
}

// ── Upload ────────────────────────────────────────────────────────────────────
const uploadFile = async (req, res) => {
  console.log('--- 🚀 Upload Started ---')
  try {
    if (!req.file)
      return res.status(400).json({ error: 'No file received' })

    const mimeType = req.file.mimetype
    const normalizedType = req.body.type ? req.body.type.toLowerCase() : null
    let resumeText = null

    // CV text extraction
    if (normalizedType === 'cv') {
      try {
        if (mimeType === 'application/pdf') {
          const data = await pdfParse(req.file.buffer)
          resumeText = data.text
        } else if (
          mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          mimeType === 'application/msword'
        ) {
          const result = await mammoth.extractRawText({ buffer: req.file.buffer })
          resumeText = result.value
        } else if (mimeType === 'text/plain') {
          resumeText = req.file.buffer.toString('utf-8')
        }
      } catch (extractError) {
        console.error('⚠️ Text extraction failed (continuing):', extractError.message)
      }
    }

    const bucket = getDocumentsBucket()
    const uploadStream = bucket.openUploadStream(
      `${Date.now()}-${req.file.originalname}`,
      {
        contentType: mimeType,
        metadata: {
          idCandidat: req.body.idCandidat || null,
          idRecruteur: req.user?.role === 'recruteur' ? req.user._id : (req.body.idRecruteur || null),
          type: normalizedType,
          typeFichier: req.body.typeFichier || null,
        },
      }
    )

    Readable.from(req.file.buffer).pipe(uploadStream)

    uploadStream.on('finish', async () => {
      try {
        const recruteurId = req.user?.role === 'recruteur' ? req.user._id : (req.body.idRecruteur || null)

        const doc = await Document.create({
          fileId: uploadStream.id,
          nomFichier: req.file.originalname,
          formatFichier: mimeType,
          taille: req.file.size,
          type: normalizedType,
          idCandidat: req.body.idCandidat || null,
          idRecruteur: recruteurId,
          typeDocument: req.body.typeDocument || null,
          typeFichier: req.body.typeFichier || null,
          resume: resumeText,
          derniereMisAjour: normalizedType === 'cv' ? new Date() : undefined,
        })

        if (normalizedType === 'cv' && req.body.idCandidat) {
          await Utilisateur.findByIdAndUpdate(req.body.idCandidat, { idCv: doc._id })
        }

        if (normalizedType === 'docrecruteur' && recruteurId) {
          const recruteur = await Utilisateur.findById(recruteurId)
          if (recruteur) {
            const update = {}
            if (recruteur.etatValidation === 'refuse') {
              update.etatValidation = 'enAttente'
              update.motifRefus = null
              update.demandeResoumise = true
              console.log(`[Upload] Refused recruiter ${recruteurId} re-submitted — resetting to enAttente`)
            }
            if (recruteur.etatValidation === 'enAttente' || recruteur.etatValidation === 'valideParIA') {
              update.demandeResoumise = true
            }
            if (Object.keys(update).length > 0) {
              await Utilisateur.findByIdAndUpdate(recruteurId, update)
            }
          }
          console.log(`[Upload] Scheduling AI verification for doc ${doc._id}`)
          verifyDocument(doc._id.toString()).catch(err =>
            console.error('[Upload] Background verification error:', err.message)
          )
        }

        res.status(201).json(doc)
      } catch (saveErr) {
        await bucket.delete(uploadStream.id).catch(() => { })
        res.status(400).json({ error: saveErr.message })
      }
    })

    uploadStream.on('error', err => res.status(500).json({ error: err.message }))
  } catch (err) {
    console.error('❌ Upload error:', err.stack)
    res.status(500).json({ error: err.message })
  }
}

// ── Download (fixed) ──────────────────────────────────────────────────────────
const downloadFile = async (req, res) => {
  try {
    const fileId = req.params.fileId
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' })
    }

    const bucket = getDocumentsBucket()
    const objectId = new mongoose.Types.ObjectId(fileId)

    // Find the file in GridFS
    const files = await bucket.find({ _id: objectId }).toArray()
    if (!files || files.length === 0) {
      console.error(`[Download] File not found in GridFS: ${fileId}`)
      return res.status(404).json({ error: 'File not found' })
    }

    // Optional: verify permissions (admin allowed)
    const doc = await Document.findOne({ fileId: objectId })
    if (doc) {
      const userId = req.user?._id?.toString()
      const isOwner = doc.idRecruteur?.toString() === userId || doc.idCandidat?.toString() === userId
      if (!isOwner && req.user?.role !== 'admin') {
        console.warn(`[Download] Access denied for user ${userId} on file ${fileId}`)
        return res.status(403).json({ error: 'Access denied' })
      }
    } else {
      // No document record – still allow admin to download raw file?
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'No permission' })
      }
      console.log(`[Download] No document metadata found for file ${fileId}, but admin allowed`)
    }

    // Set headers for inline display
    res.set('Content-Type', files[0].contentType)
    res.set('Content-Disposition', `inline; filename="${files[0].filename}"`)

    const downloadStream = bucket.openDownloadStream(objectId)
    downloadStream.on('error', (err) => {
      console.error(`[Download] Stream error for ${fileId}:`, err)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream error' })
      }
    })
    downloadStream.pipe(res)
  } catch (err) {
    console.error('[Download] Unexpected error:', err)
    res.status(500).json({ error: err.message })
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
const deleteFile = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Document not found' })

    const bucket = getDocumentsBucket()
    await bucket.delete(doc.fileId)
    await Document.findByIdAndDelete(req.params.id)

    res.json({ message: 'Document deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Get docs by candidate ─────────────────────────────────────────────────────
const getDocsByCandidat = async (req, res) => {
  try {
    const docs = await Document.find({ idCandidat: req.params.idCandidat })
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Get docs by recruiter ─────────────────────────────────────────────────────
const getDocsByRecruteur = async (req, res) => {
  try {
    const docs = await Document.find({
      idRecruteur: req.params.idRecruteur,
      type: 'docrecruteur',
    }).sort({ dateUpload: -1 })
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Manual re-trigger AI verification (admin only) ────────────────────────────
const triggerVerification = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc)
      return res.status(404).json({ error: 'Document not found' })
    if (doc.type !== 'docrecruteur')
      return res.status(400).json({ error: 'Only recruiter documents can be verified' })
    if (doc.verificationEnCours)
      return res.status(409).json({ error: 'Verification already in progress' })

    verifyDocument(doc._id.toString()).catch(err =>
      console.error('[ManualVerify] Error:', err.message)
    )

    res.json({ message: 'Verification started. Check back in a few seconds.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── GET /api/documents/recruteur/status ──────────────────────────────────────
const getMyVerificationStatus = async (req, res) => {
  try {
    const user = await Utilisateur.findById(req.user._id).select('etatValidation motifRefus role')
    if (!user || user.role !== 'recruteur')
      return res.status(403).json({ error: 'Recruiters only' })

    const docs = await Document.find({
      idRecruteur: req.user._id,
      type: 'docrecruteur',
    }).select('nomFichier typeDocument dateUpload aiVerification estVerifie').sort({ dateUpload: -1 })

    res.json({
      etatValidation: user.etatValidation,
      motifRefus: user.motifRefus || null,
      documents: docs,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  uploadFile,
  downloadFile,
  deleteFile,
  getDocsByCandidat,
  getDocsByRecruteur,
  triggerVerification,
  getMyVerificationStatus,
}