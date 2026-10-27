
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

// Store actions and nickname-based participant information.
const actionSchema = new mongoose.Schema(
  {
    nickname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 24,
    },
    nicknameKey: { type: String, required: true, index: true },
    name: { type: String, required: true },
    icon: String,
    points: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

const EcoAction = mongoose.model("EcoAction", actionSchema);

const allowedActions = {
  "Plant a tree": { icon: "🌳", points: 50 },
  "Recycle waste": { icon: "♻️", points: 20 },
  "Save water": { icon: "💧", points: 15 },
  "Save electricity": { icon: "⚡", points: 15 },
};

function getNickname(value) {
  if (typeof value !== "string") return null;

  const nickname = value.trim().replace(/\s+/g, " ");

  if (
    nickname.length < 2 ||
    nickname.length > 24 ||
    !/^[\p{L}\p{N} _-]+$/u.test(nickname)
  ) {
    return null;
  }

  return nickname;
}

app.get("/", (req, res) => {
  res.send("🌱 EchoGarden backend is running!");
});

// Load one participant's activity history.
app.get("/api/actions", async (req, res) => {
  const nickname = getNickname(req.query.nickname);

  if (!nickname) {
    return res.status(400).json({
      message: "Provide a nickname between 2 and 24 characters.",
    });
  }

  try {
    const actions = await EcoAction.find({
      nicknameKey: nickname.toLowerCase(),
    }).sort({ createdAt: -1 });

    res.json(actions);

} catch (error) {
  console.error("SAVE ACTION ERROR:", error);
  res.status(500).json({
    message: "Could not save action.",
    detail: error.message,
  });
}

});

// Save an eco-action.
app.post("/api/actions", async (req, res) => {
  const nickname = getNickname(req.body.nickname);
  const { name, description } = req.body;
  const allowed = allowedActions[name];

  if (!nickname || !allowed) {
    return res.status(400).json({
      message: "Enter a valid nickname and choose a valid eco-action.",
    });
  }

  try {
    const action = await EcoAction.create({
      nickname,
      nicknameKey: nickname.toLowerCase(),
      name,
      icon: allowed.icon,
      points: allowed.points,
      description:
        typeof description === "string"
          ? description.trim().slice(0, 300)
          : "",
    });

    res.status(201).json(action);
  } catch (error) {
    console.error("Save action error:", error.message);
    res.status(500).json({ message: "Could not save action." });
  }
});

// Participant's report for the last 7 days.
app.get("/api/reports/weekly", async (req, res) => {
  const nickname = getNickname(req.query.nickname);

  if (!nickname) {
    return res.status(400).json({ message: "A valid nickname is required." });
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const actions = await EcoAction.find({
      nicknameKey: nickname.toLowerCase(),
      createdAt: { $gte: since },
    });

    const byAction = {};

    for (const action of actions) {
      if (!byAction[action.name]) {
        byAction[action.name] = { count: 0, points: 0 };
      }
      byAction[action.name].count += 1;
      byAction[action.name].points += action.points;
    }

    res.json({
      nickname,
      period: "Last 7 days",
      totalActions: actions.length,
      totalPoints: actions.reduce((sum, action) => sum + action.points, 0),
      byAction,
    });
  } catch (error) {
    console.error("Weekly report error:", error.message);
    res.status(500).json({ message: "Could not load weekly report." });
  }
});

// Community leaderboard: top 20 participants.
app.get("/api/leaderboard", async (req, res) => {
  try {
    const leaders = await EcoAction.aggregate([
      {
        $group: {
          _id: "$nicknameKey",
          nickname: { $first: "$nickname" },
          totalPoints: { $sum: "$points" },
          actionsCompleted: { $sum: 1 },
        },
      },
      { $sort: { totalPoints: -1, actionsCompleted: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          nickname: 1,
          totalPoints: 1,
          actionsCompleted: 1,
        },
      },
    ]);

    res.json(leaders);
  } catch (error) {
    console.error("Leaderboard error:", error.message);
    res.status(500).json({ message: "Could not load leaderboard." });
  }
});

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`🌱 EchoGarden server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
