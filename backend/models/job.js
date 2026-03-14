const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title:       { type: String, required: true },
  description: { type: String, required: true },
  location:    { type: String },
  skills:      [String],
  isOpen:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Job", jobSchema);