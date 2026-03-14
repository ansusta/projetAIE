const multer = require("multer")

const storage = multer.memoryStorage() // store file in memory temporarily

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"]
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error("Only PDF, JPEG and PNG files are allowed"))
    }
  }
})

module.exports = upload