const { GoogleGenerativeAI } = require('@google/generative-ai')

if (!process.env.GEMINI_API_KEY) {
  console.warn('[Gemini] WARNING: GEMINI_API_KEY is not set. Document verification will fail.')
}

const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Gemini 1.5 Flash — fast, multimodal, supports PDF + images natively
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

module.exports = { model }