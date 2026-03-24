const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const achievements = [];

app.post("/achievements", (req, res) => {
  const { title, category, description } = req.body;

  if (!title || !category || !description) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const newAchievement = {
    id: achievements.length + 1,
    title,
    category,
    description,
    status: "pending"
  };

  achievements.push(newAchievement);
  res.status(201).json(newAchievement);
});

app.get("/achievements", (req, res) => {
  res.json(achievements);
});

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "VeriTrack backend running" });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});