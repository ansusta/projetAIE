const mongoose = require("mongoose");

const cvSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content:  { type: String },       // extracted text
  fileUrl:  { type: String },       // link to S3/Cloudinary
  skills:   [String],
}, { timestamps: true });

module.exports = mongoose.model("CV", cvSchema);