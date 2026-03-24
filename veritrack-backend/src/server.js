const express = require("express");
const cors = require("cors");
const prisma = require("./prisma");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

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

app.post("/achievements", async (req, res) => {
  const { user_id, title, category, description, date, proof_url } = req.body;

  if (!title || !category || !description) {
    return res.status(400).json({ message: "title, category, and description are required" });
  }

  try {
    const newAchievement = await prisma.achievements.create({
      data: {
        user_id: user_id || null,
        title,
        category,
        description,
        date: date ? new Date(date) : null,
        proof_url: proof_url || null,
        status: "pending",
        score: 0
      }
    });

    res.status(201).json(newAchievement);
  } catch (e) {
    console.error("POST /achievements error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/achievements", async (req, res) => {
  try {
    const data = await prisma.achievements.findMany({
      orderBy: { created_at: "desc" }
    });
    res.json(data);
  } catch (e) {
    console.error("GET /achievements error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/profile", async (req, res) => {
  try {
    const achievements = await prisma.achievements.findMany();

    const score = calculateScore(achievements);
    const approvedCount = achievements.filter(
      (a) => (a.status || "").toLowerCase() === "approved"
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
  } catch (e) {
    console.error("GET /profile error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/verify", async (req, res) => {
  try {
    const achievements = await prisma.achievements.findMany();

    const score = calculateScore(achievements);
    const approvedCount = achievements.filter(
      (a) => (a.status || "").toLowerCase() === "approved"
    ).length;

    res.send(`
      <html>
        <head>
          <title>VeriTrack Verification</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #0f172a;
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .card {
              background: #1e293b;
              padding: 24px;
              border-radius: 20px;
              width: 90%;
              max-width: 420px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .subtitle {
              color: #cbd5e1;
              margin-bottom: 20px;
            }
            .score {
              font-size: 44px;
              font-weight: bold;
              color: #60a5fa;
              margin: 10px 0;
            }
            .badge {
              display: inline-block;
              background: rgba(34,197,94,0.15);
              color: #22c55e;
              padding: 8px 14px;
              border-radius: 999px;
              font-weight: 600;
              margin-top: 14px;
            }
            .line {
              margin: 10px 0;
              color: #e2e8f0;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="title">VeriTrack</div>
            <div class="subtitle">Verified Student Achievement Profile</div>
            <div class="line">Total Records: ${achievements.length}</div>
            <div class="line">Verified Records: ${approvedCount}</div>
            <div class="score">Score: ${score}</div>
            <div class="line">${
              score > 80
                ? "Excellent profile"
                : score > 50
                ? "Strong profile"
                : "Needs improvement"
            }</div>
            <div class="badge">Verified by VeriTrack</div>
          </div>
        </body>
      </html>
    `);
  } catch (e) {
    console.error("GET /verify error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.patch("/achievements/:id/approve", async (req, res) => {
  const id = req.params.id;

  try {
    const updated = await prisma.achievements.update({
      where: { id },
      data: { status: "approved" }
    });

    res.json(updated);
  } catch (e) {
    console.error("PATCH /achievements/:id/approve error:", e);
    res.status(404).json({ error: e.message });
  }
});

app.patch("/achievements/:id/reject", async (req, res) => {
  const role = req.headers.role;

  if (role !== "admin") {
    return res.status(403).json({ message: "Only admin can reject" });
  }

  const id = req.params.id;

  try {
    const updated = await prisma.achievements.update({
      where: { id },
      data: { status: "rejected" }
    });

    res.json(updated);
  } catch (e) {
    console.error("PATCH /achievements/:id/reject error:", e);
    res.status(404).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});