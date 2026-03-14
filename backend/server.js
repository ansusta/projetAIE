require("dotenv").config();
require('./models/Utilisateur')
require('./models/OffreTravail')
require('./models/Candidature')
require('./models/Notification')
require('./models/Document')
require('./models/Match')
const documentRoutes = require('./routes/document.routes')
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const connectDB = require("./config/db");
const Utilisateur = require('./models/Utilisateur')
const authRoutes = require('./routes/auth.routes')

const app = express();

app.use(cors());
app.use(express.json());
connectDB();

app.get("/", (req, res) => {
  res.send("Backend is running");
});
app.post("/api/match", async (req, res) => {
  try {
    const { cvText, jobText } = req.body;

    const response = await axios.post("http://localhost:8000/match", {
      cv_text: cvText,
      job_text: jobText
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "AI service failed" });
  }
});


app.post("/api/test/user", async (req, res) => {
  try {
    const user = await Utilisateur.create({
      email: "test@test.com",
      motDePasse: "123456",
      role: "candidat",
      nom: "Dupont",
      prenom: "Jean",
      statusCompte: "actif"
    })
    res.status(201).json(user)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.use('/api/documents', documentRoutes)



app.use('/api/auth', authRoutes)
// After your routes
app.use((err, req, res, next) => {
  if (err.name === "MulterError" || err.message.includes("Only PDF")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


