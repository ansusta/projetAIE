require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


