const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const achievements = [];

function calculateScore(achievements) {
  let score = 0;

  achievements.forEach((a) => {
    if ((a.status || "").toLowerCase() !== "approved") return;

    switch ((a.category || "").toLowerCase()) {
      case "internship":
        score += 30;
        break;
      case "hackathon":
        score += 20;
        break;
      case "certification":
        score += 10;
        break;
      case "sports":
        score += 15;
        break;
      default:
        score += 5;
    }
  });

  return score;
}

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "VeriTrack backend running" });
});

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

app.get("/profile", (req, res) => {
  const score = calculateScore(achievements);

  const approvedCount = achievements.filter(
    (a) => a.status === "approved"
  ).length;

  res.json({
    totalAchievements: achievements.length,
    approvedCount,
    score,
    message:
      score > 80
        ? "Excellent profile"
        : score > 50
        ? "Strong profile"
        : "Needs improvement"
  });
});

app.patch("/achievements/:id/approve", (req, res) => {
  const id = Number(req.params.id);
  const achievement = achievements.find((a) => a.id === id);

  if (!achievement) {
    return res.status(404).json({ message: "Achievement not found" });
  }

  achievement.status = "approved";
  res.json(achievement);
});

app.patch("/achievements/:id/reject", (req, res) => {
  const id = Number(req.params.id);
  const achievement = achievements.find((a) => a.id === id);

  if (!achievement) {
    return res.status(404).json({ message: "Achievement not found" });
  }

  achievement.status = "rejected";
  res.json(achievement);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});