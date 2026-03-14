const express = require("express")
const router = express.Router()
const multer = require("../config/multer")
const Document = require("../models/Document")
const getGridFSBucket = require("../config/gridfs")
const mongoose = require("mongoose")
const { Readable } = require("stream")

// ─── UPLOAD ───────────────────────────────────────────────
router.post("/upload", multer.single("file"), async (req, res) => {
  try {
    console.log("req.file:", req.file)
    console.log("req.body:", req.body)

    if (!req.file) return res.status(400).json({ error: "No file received" })

    const bucket = getGridFSBucket()

    // convert buffer to stream and upload to GridFS
    const readableStream = Readable.from(req.file.buffer)
    const uploadStream = bucket.openUploadStream(`${Date.now()}-${req.file.originalname}`, {
      contentType: req.file.mimetype,
      metadata: {
        idCandidat: req.body.idCandidat || null,
        type: req.body.type,
        typeFichier: req.body.typeFichier || null,
      }
    })

    readableStream.pipe(uploadStream)

    uploadStream.on("finish", async () => {
      const doc = await Document.create({
        fileId: uploadStream.id,
        nomFichier: req.file.originalname,
        formatFichier: req.file.mimetype,
        taille: req.file.size,
        type: req.body.type,
        idCandidat: req.body.idCandidat || null,
        typeFichier: req.body.typeFichier || null,
        idRecruteur: req.body.idRecruteur || null,
        typeDocument: req.body.typeDocument || null,
      })
      res.status(201).json(doc)
    })

    uploadStream.on("error", (err) => {
      res.status(500).json({ error: err.message })
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// ─── DOWNLOAD / VIEW ──────────────────────────────────────
router.get("/file/:fileId", async (req, res) => {
  try {
    const bucket = getGridFSBucket()
    const fileId = new mongoose.Types.ObjectId(req.params.fileId)
    const stream = bucket.openDownloadStream(fileId)
    stream.on("error", () => res.status(404).json({ error: "File not found" }))
    stream.pipe(res)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── DELETE ───────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: "Document not found" })
    const bucket = getGridFSBucket()
    await bucket.delete(doc.fileId)
    await Document.findByIdAndDelete(req.params.id)
    res.json({ message: "Document deleted" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET ALL DOCS FOR A CANDIDATE ─────────────────────────
router.get("/candidat/:idCandidat", async (req, res) => {
  try {
    const docs = await Document.find({ idCandidat: req.params.idCandidat })
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router