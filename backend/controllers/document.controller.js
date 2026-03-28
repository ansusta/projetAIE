const mongoose = require("mongoose")
const { Readable } = require("stream")
const Document = require("../models/Document")
const getGridFSBucket = require("../config/gridfs")

// ─── UPLOAD DOCUMENT ──────────────────────────────────────
const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file received" })

    // normalize type to match schema enum
    const normalizedType = req.body.type ? req.body.type.toLowerCase() : null

    // check if bucket is ready
    let bucket
    try {
      bucket = getGridFSBucket()
    } catch (e) {
      return res.status(503).json({ error: "Database not ready. Try again." })
    }

    const readableStream = Readable.from(req.file.buffer)
    const uploadStream = bucket.openUploadStream(`${Date.now()}-${req.file.originalname}`, {
      contentType: req.file.mimetype,
      metadata: {
        idCandidat: req.body.idCandidat || null,
        type: normalizedType,
        typeFichier: req.body.typeFichier || null,
      }
    })

    readableStream.pipe(uploadStream)

    uploadStream.on("finish", async () => {
      try {
        const doc = await Document.create({
          fileId: uploadStream.id,
          nomFichier: req.file.originalname,
          formatFichier: req.file.mimetype,
          taille: req.file.size,
          type: normalizedType,
          idCandidat: req.body.idCandidat || null,
          typeFichier: req.body.typeFichier || null,
          idRecruteur: req.body.idRecruteur || null,
          typeDocument: req.body.typeDocument || null,
        })
        res.status(201).json(doc)
      } catch (saveErr) {
        // rollback: delete file from GridFS if DB save fails
        await bucket.delete(uploadStream.id)
        res.status(400).json({ error: saveErr.message })
      }
    })

    uploadStream.on("error", (err) => {
      res.status(500).json({ error: err.message })
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ─── DOWNLOAD / VIEW FILE ─────────────────────────────────
const downloadFile = async (req, res) => {
  try {
    const bucket = getGridFSBucket()
    const fileId = new mongoose.Types.ObjectId(req.params.fileId)

    // Find the file metadata to set headers
    const files = await bucket.find({ _id: fileId }).toArray()
    if (!files || files.length === 0) {
      return res.status(404).json({ error: "File not found" })
    }

    res.set('Content-Type', files[0].contentType)
    res.set('Content-Disposition', `inline; filename="${files[0].filename}"`)

    const stream = bucket.openDownloadStream(fileId)
    stream.on("error", () => res.status(404).json({ error: "Stream error" }))
    stream.pipe(res)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ─── DELETE DOCUMENT ──────────────────────────────────────
const deleteFile = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: "Document not found" })

    const bucket = getGridFSBucket()
    
    // delete actual file from GridFS
    await bucket.delete(doc.fileId)
    
    // delete metadata from MongoDB
    await Document.findByIdAndDelete(req.params.id)
    
    res.json({ message: "Document deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// ─── GET ALL DOCS FOR A CANDIDATE ─────────────────────────
const getDocsByCandidat = async (req, res) => {
  try {
    const docs = await Document.find({ idCandidat: req.params.idCandidat })
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { uploadFile, downloadFile, deleteFile, getDocsByCandidat }