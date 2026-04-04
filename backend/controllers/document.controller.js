const mongoose = require("mongoose");
const { Readable } = require("stream");
const Document = require("../models/Document");
const getGridFSBucket = require("../config/gridfs");
const Utilisateur = require('../models/Utilisateur');

// Use the more stable version of the library
const pdfParse = require('pdf-extraction');
const mammoth = require('mammoth');


const uploadFile = async (req, res) => {
  console.log("--- 🚀 Multi-Format Upload Started ---");
  try {
    if (!req.file) {
      console.error("❌ No file received");
      return res.status(400).json({ error: "No file received" });
    }

    const mimeType = req.file.mimetype;
    const normalizedType = req.body.type ? req.body.type.toLowerCase() : null;
    let resumeText = null;

    console.log(`📁 Processing: ${req.file.originalname} | Mime: ${mimeType}`);

    // ─── EXTRACTION STRATEGY ──────────────────────────────────────────
    if (normalizedType === 'cv') {
      try {
        if (mimeType === "application/pdf") {
          console.log("📑 Strategy: PDF Extraction");
          const data = await pdfParse(req.file.buffer);
          resumeText = data.text;
        } 
        
        else if (
          mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
          mimeType === "application/msword"
        ) {
          console.log("📝 Strategy: Word (.docx) Extraction");
          // Mammoth extracts raw text from the buffer
          const result = await mammoth.extractRawText({ buffer: req.file.buffer });
          resumeText = result.value; 
        } 
        
        else if (mimeType === "text/plain") {
          console.log("📄 Strategy: Plain Text Extraction");
          resumeText = req.file.buffer.toString('utf-8');
        } 
        
        else if (mimeType.startsWith("image/")) {
          console.log("🖼️ Strategy: Image detected. (Note: OCR required for text, skipping for now)");
          // If you ever add Tesseract.js, it goes here
        }

        if (resumeText) {
          console.log(`✅ Extraction Success! (${resumeText.length} characters)`);
        }
      } catch (extractError) {
        console.error("⚠️ Extraction failed but continuing upload:", extractError.message);
      }
    }
    // ──────────────────────────────────────────────────────────────────

    // GridFS Upload Logic
    let bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStream(`${Date.now()}-${req.file.originalname}`, {
      contentType: mimeType,
      metadata: {
        idCandidat: req.body.idCandidat || null,
        type: normalizedType,
        typeFichier: req.body.typeFichier || null,
      }
    });

    Readable.from(req.file.buffer).pipe(uploadStream);

    uploadStream.on("finish", async () => {
      try {
        const doc = await Document.create({
          fileId: uploadStream.id,
          nomFichier: req.file.originalname,
          formatFichier: mimeType,
          taille: req.file.size,
          type: normalizedType,
          idCandidat: req.body.idCandidat || null,
          typeFichier: req.body.typeFichier || null,
          idRecruteur: req.body.idRecruteur || null,
          typeDocument: req.body.typeDocument || null,
          resume: resumeText,
          derniereMisAjour: normalizedType === 'cv' ? new Date() : undefined
        });

        if (normalizedType === 'cv' && req.body.idCandidat) {
          await Utilisateur.findByIdAndUpdate(req.body.idCandidat, { idCv: doc._id });
        }

        res.status(201).json(doc);
      } catch (saveErr) {
        await bucket.delete(uploadStream.id);
        res.status(400).json({ error: saveErr.message });
      }
    });

    uploadStream.on("error", (err) => res.status(500).json({ error: err.message }));

  } catch (err) {
    console.error("❌ Global Error:", err.stack);
    res.status(500).json({ error: err.message });
  }
};

// Keep your downloadFile, deleteFile, etc. below...
const downloadFile = async (req, res) => {   try {

    const bucket = getGridFSBucket()

    const fileId = new mongoose.Types.ObjectId(req.params.fileId)



    const files = await bucket.find({ _id: fileId }).toArray()

    if (!files || files.length === 0)

      return res.status(404).json({ error: "File not found" })



    res.set('Content-Type', files[0].contentType)

    res.set('Content-Disposition', `inline; filename="${files[0].filename}"`)



    const stream = bucket.openDownloadStream(fileId)

    stream.on("error", () => res.status(404).json({ error: "Stream error" }))

    stream.pipe(res)

  } catch (err) {

    res.status(500).json({ error: err.message })

  } };
const deleteFile = async (req, res) => {  try {

    const doc = await Document.findById(req.params.id)

    if (!doc) return res.status(404).json({ error: "Document not found" })



    const bucket = getGridFSBucket()

    await bucket.delete(doc.fileId)

    await Document.findByIdAndDelete(req.params.id)



    res.json({ message: "Document deleted successfully" })

  } catch (err) {

    res.status(500).json({ error: err.message })

  } };
const getDocsByCandidat = async (req, res) => { try {

    const docs = await Document.find({ idCandidat: req.params.idCandidat })

    res.json(docs)

  } catch (err) {

    res.status(500).json({ error: err.message })

  }};

module.exports = { uploadFile, downloadFile, deleteFile, getDocsByCandidat };