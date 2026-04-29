const mongoose   = require('mongoose')
const { Readable } = require('stream')
const Document   = require('../models/Document')
const getGridFSBucket = require('../config/gridfs')
const Utilisateur     = require('../models/Utilisateur')
const { verifyDocument } = require('../services/verification.service')

const pdfParse = require('pdf-extraction')
const mammoth  = require('mammoth')

// ── Upload ────────────────────────────────────────────────────────────────────
const uploadFile = async (req, res) => {
  console.log('--- 🚀 Upload Started ---')
  try {
    if (!req.file)
      return res.status(400).json({ error: 'No file received' })

    const mimeType       = req.file.mimetype
    const normalizedType = req.body.type ? req.body.type.toLowerCase() : null
    let   resumeText     = null

    // ── CV text extraction ───────────────────────────────────────────────────
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
          resumeText   = result.value
        } else if (mimeType === 'text/plain') {
          resumeText = req.file.buffer.toString('utf-8')
        }
      } catch (extractError) {
        console.error('⚠️ Text extraction failed (continuing):', extractError.message)
      }
    }

    // ── GridFS upload ────────────────────────────────────────────────────────
    const bucket       = getGridFSBucket()
    const uploadStream = bucket.openUploadStream(
      `${Date.now()}-${req.file.originalname}`,
      {
        contentType: mimeType,
metadata: {
  idCandidat:  req.body.idCandidat || null,
  idRecruteur: req.user?.role === 'recruteur' ? req.user._id : (req.body.idRecruteur || null),
  type:        normalizedType,
  typeFichier: req.body.typeFichier || null,
},

      }
    )

    Readable.from(req.file.buffer).pipe(uploadStream)

    uploadStream.on('finish', async () => {
      try {
        const doc = await Document.create({
          fileId:       uploadStream.id,
          nomFichier:   req.file.originalname,
          formatFichier: mimeType,
          taille:       req.file.size,
          type:         normalizedType,
idCandidat:   req.body.idCandidat  || null,
idRecruteur:  req.user?.role === 'recruteur' ? req.user._id : (req.body.idRecruteur || null),
          typeDocument: req.body.typeDocument || null,
          typeFichier:  req.body.typeFichier  || null,
          resume:       resumeText,
          derniereMisAjour: normalizedType === 'cv' ? new Date() : undefined,
        })

        // Link CV to user
        if (normalizedType === 'cv' && req.body.idCandidat) {
          await Utilisateur.findByIdAndUpdate(req.body.idCandidat, { idCv: doc._id })
        }

        // ── Trigger AI verification asynchronously for recruiter docs ────────
        // We respond to the client immediately and run verification in the background.
        if (normalizedType === 'docrecruteur') {
          console.log(`[Upload] Scheduling AI verification for doc ${doc._id}`)
          verifyDocument(doc._id.toString()).catch(err =>
            console.error('[Upload] Background verification error:', err.message)
          )
        }

        res.status(201).json(doc)
      } catch (saveErr) {
        await bucket.delete(uploadStream.id).catch(() => {})
        res.status(400).json({ error: saveErr.message })
      }
    })

    uploadStream.on('error', err => res.status(500).json({ error: err.message }))
  } catch (err) {
    console.error('❌ Upload error:', err.stack)
    res.status(500).json({ error: err.message })
  }
}

// ── Download ──────────────────────────────────────────────────────────────────
const downloadFile = async (req, res) => {
  try {
    const bucket = getGridFSBucket()
    const fileId = new mongoose.Types.ObjectId(req.params.fileId)

    const files = await bucket.find({ _id: fileId }).toArray()
    if (!files || files.length === 0)
      return res.status(404).json({ error: 'File not found' })

    // ── Ownership check ──────────────────────────────────────────────────────
    const doc = await Document.findOne({ fileId })
    if (doc) {
      const userId = req.user?._id?.toString()
      const isOwner =
        doc.idRecruteur?.toString() === userId ||
        doc.idCandidat?.toString()  === userId
      if (!isOwner && req.user?.role !== 'admin')
        return res.status(403).json({ error: 'Access denied' })
    }

    res.set('Content-Type',        files[0].contentType)
    res.set('Content-Disposition', `inline; filename="${files[0].filename}"`)

    const stream = bucket.openDownloadStream(fileId)
    stream.on('error', () => res.status(404).json({ error: 'Stream error' }))
    stream.pipe(res)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
const deleteFile = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Document not found' })

    const bucket = getGridFSBucket()
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

// ── Get docs by recruiter (with AI verification results) ──────────────────────
const getDocsByRecruteur = async (req, res) => {
  try {
    const docs = await Document.find({
      idRecruteur:  req.params.idRecruteur,
      type:         'docrecruteur',
    }).sort({ dateUpload: -1 })
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ── Manual re-trigger AI verification (admin only) ────────────────────────────
// POST /api/documents/:id/verify
const triggerVerification = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc)
      return res.status(404).json({ error: 'Document not found' })
    if (doc.type !== 'docrecruteur')
      return res.status(400).json({ error: 'Only recruiter documents can be verified' })
    if (doc.verificationEnCours)
      return res.status(409).json({ error: 'Verification already in progress' })

    // Run async — client gets immediate acknowledgement
    verifyDocument(doc._id.toString()).catch(err =>
      console.error('[ManualVerify] Error:', err.message)
    )

    res.json({ message: 'Verification started. Check back in a few seconds.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
// GET /api/documents/recruteur/status
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
      etatValidation: user.etatValidation,   // 'enAttente' | 'valideParIA' | 'valideParAdmin' | 'refuse'
      motifRefus:     user.motifRefus || null, // admin's rejection reason
      documents:      docs,
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
  triggerVerification, getMyVerificationStatus,
}