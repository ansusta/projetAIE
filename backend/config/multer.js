const multer = require("multer")

const storage = multer.memoryStorage() // store file in memory temporarily

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
fileFilter: (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text",
    "text/plain",
    "application/rtf",
    "image/jpeg",
    "image/png",
    "image/webp"
  ]

  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    // Better error message for the user
    cb(new Error(`Format ${file.mimetype} is not supported. Please use PDF, Word, ODT, or common image formats.`))
  }
}
})

module.exports = upload