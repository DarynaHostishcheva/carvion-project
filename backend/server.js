const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./database");
const authRoutes = require("./routes/authRoutes");
const careerRoutes = require("./routes/careerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const quizRoutes = require("./routes/quizRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/careers", careerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/chats", chatRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Carvion backend is running"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS db_connected");

    res.json({
      server: "ok",
      database: rows[0].db_connected === 1 ? "ok" : "error"
    });
  } catch (error) {
    res.status(500).json({
      server: "ok",
      database: "error",
      message: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});