const express = require("express");

const pool = require("../database");
const checkAuth = require("../middleware/checkAuth");
const {
  generateAIResponse
} = require("../services/aiService");

const router = express.Router();

async function getChatContext(userId) {
  const [savedCareers] = await pool.query(
    `
      SELECT
        Careers.id,
        Careers.name,
        Careers.description,
        Careers.category
      FROM SavedCareers
      JOIN Careers
        ON Careers.id = SavedCareers.career_id
      WHERE SavedCareers.user_id = ?
      ORDER BY SavedCareers.created_at DESC
      LIMIT 5
    `,
    [userId]
  );

  const [recommendations] = await pool.query(
    `
      SELECT
        Careers.id,
        Careers.name,
        Careers.description,
        Careers.category,
        UserResults.score
      FROM UserResults
      JOIN Careers
        ON Careers.id = UserResults.career_id
      WHERE UserResults.user_id = ?
      ORDER BY UserResults.score DESC
      LIMIT 5
    `,
    [userId]
  );

  const [quizResults] = await pool.query(
    `
      SELECT
        Quizzes.name AS quiz_name,
        UserQuizResults.result_title,
        UserQuizResults.result_text,
        UserQuizResults.status,
        UserQuizResults.completed_at
      FROM UserQuizResults
      JOIN Quizzes
        ON Quizzes.id = UserQuizResults.quiz_id
      WHERE UserQuizResults.user_id = ?
      ORDER BY UserQuizResults.completed_at DESC
      LIMIT 3
    `,
    [userId]
  );

  const [skills] = await pool.query(
    `
      SELECT
        Skills.id,
        Skills.name,
        UserSkills.source,
        UserSkills.weight
      FROM UserSkills
      JOIN Skills
        ON Skills.id = UserSkills.skill_id
      WHERE UserSkills.user_id = ?
      ORDER BY UserSkills.weight DESC
      LIMIT 10
    `,
    [userId]
  );

  return {
    savedCareers,
    recommendations,
    quizResults,
    skills
  };
}

router.get("/", checkAuth, async (req, res) => {
  try {
    const [chats] = await pool.query(
      `
        SELECT id, title, created_at, updated_at
        FROM ChatSessions
        WHERE user_id = ?
        ORDER BY updated_at DESC
      `,
      [req.user.id]
    );

    res.json({
      chats
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load chats",
      error: error.message
    });
  }
});

router.post("/", checkAuth, async (req, res) => {
  try {
    const title =
      req.body.title || "New chat";

    const [result] = await pool.query(
      `
        INSERT INTO ChatSessions (user_id, title)
        VALUES (?, ?)
      `,
      [req.user.id, title]
    );

    res.status(201).json({
      chat: {
        id: result.insertId,
        title
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create chat",
      error: error.message
    });
  }
});

router.get("/:id", checkAuth, async (req, res) => {
  try {
    const chatId = req.params.id;

    const [chats] = await pool.query(
      `
        SELECT id, title, created_at, updated_at
        FROM ChatSessions
        WHERE id = ?
        AND user_id = ?
      `,
      [chatId, req.user.id]
    );

    if (chats.length === 0) {
      return res.status(404).json({
        message: "Chat not found"
      });
    }

    const [messages] = await pool.query(
      `
        SELECT id, sender, message, created_at
        FROM ChatMessages
        WHERE chat_id = ?
        ORDER BY created_at ASC, id ASC
      `,
      [chatId]
    );

    res.json({
      chat: chats[0],
      messages
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load chat",
      error: error.message
    });
  }
});

router.post("/:id/messages", checkAuth, async (req, res) => {
  try {
    const chatId = req.params.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        message: "Message is required"
      });
    }

    const [chats] = await pool.query(
      `
        SELECT id, title
        FROM ChatSessions
        WHERE id = ?
        AND user_id = ?
      `,
      [chatId, req.user.id]
    );

    if (chats.length === 0) {
      return res.status(404).json({
        message: "Chat not found"
      });
    }

    await pool.query(
      `
        INSERT INTO ChatMessages (chat_id, sender, message)
        VALUES (?, 'user', ?)
      `,
      [chatId, message]
    );

    if (chats[0].title === "New chat") {
      await pool.query(
        `
          UPDATE ChatSessions
          SET title = ?
          WHERE id = ?
        `,
        [message.slice(0, 40), chatId]
      );
    }

    const context =
      await getChatContext(req.user.id);

    const aiReply =
      await generateAIResponse(message, context);

    await pool.query(
      `
        INSERT INTO ChatMessages (chat_id, sender, message)
        VALUES (?, 'assistant', ?)
      `,
      [chatId, aiReply]
    );

    await pool.query(
      `
        UPDATE ChatSessions
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [chatId]
    );

    res.json({
      userMessage: {
        sender: "user",
        message
      },
      aiMessage: {
        sender: "assistant",
        message: aiReply
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to send message",
      error: error.message
    });
  }
});

module.exports = router;