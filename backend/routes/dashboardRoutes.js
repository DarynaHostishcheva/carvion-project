const express = require("express");

const pool = require("../database");
const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

router.get("/", checkAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      `
        SELECT id, email, name
        FROM Users
        WHERE id = ?
      `,
      [userId]
    );

    const [profiles] = await pool.query(
      `
        SELECT status, description
        FROM UserProfiles
        WHERE user_id = ?
      `,
      [userId]
    );

    const [compassSkills] = await pool.query(
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
        ORDER BY Skills.name ASC
      `,
      [userId]
    );

    const [completedQuizzes] = await pool.query(
      `
        SELECT
          UserQuizResults.id,
          UserQuizResults.quiz_id,
          Quizzes.name AS title,
          UserQuizResults.result_title,
          UserQuizResults.result_text,
          UserQuizResults.status,
          UserQuizResults.completed_at
        FROM UserQuizResults
        JOIN Quizzes
          ON Quizzes.id = UserQuizResults.quiz_id
        WHERE UserQuizResults.user_id = ?
        ORDER BY UserQuizResults.completed_at DESC
      `,
      [userId]
    );

    const [savedCareers] = await pool.query(
      `
        SELECT
          Careers.id,
          Careers.name,
          Careers.description,
          Careers.category,
          SavedCareers.created_at
        FROM SavedCareers
        JOIN Careers
          ON Careers.id = SavedCareers.career_id
        WHERE SavedCareers.user_id = ?
        ORDER BY SavedCareers.created_at DESC
      `,
      [userId]
    );

    res.json({
      user: users[0],
      profile: profiles[0] || {
        status: "Exploring Options",
        description:
          "Career explorer passionate about discovering meaningful paths."
      },
      compassSkills,
      completedQuizzes,
      savedCareers
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load dashboard",
      error: error.message
    });
  }
});

router.put("/profile", checkAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, status, description } = req.body;

    if (name) {
      await pool.query(
        `
          UPDATE Users
          SET name = ?
          WHERE id = ?
        `,
        [name, userId]
      );
    }

    await pool.query(
      `
        INSERT INTO UserProfiles (user_id, status, description)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          description = VALUES(description)
      `,
      [
        userId,
        status || "Exploring Options",
        description || ""
      ]
    );

    res.json({
      message: "Profile updated"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message
    });
  }
});

router.get("/skills", checkAuth, async (req, res) => {
  try {
    const [skills] = await pool.query(
      `
        SELECT id, name
        FROM Skills
        ORDER BY name ASC
      `
    );

    res.json({
      skills
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load skills",
      error: error.message
    });
  }
});

router.post("/skills", checkAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { skillId } = req.body;

    if (!skillId) {
      return res.status(400).json({
        message: "Skill id is required"
      });
    }

    await pool.query(
      `
        INSERT IGNORE INTO UserSkills
          (user_id, skill_id, source, weight)
        VALUES (?, ?, 'manual', 1.0)
      `,
      [userId, skillId]
    );

    res.json({
      message: "Skill added"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add skill",
      error: error.message
    });
  }
});

router.delete("/skills/:skillId", checkAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const skillId = req.params.skillId;

    await pool.query(
      `
        DELETE FROM UserSkills
        WHERE user_id = ?
        AND skill_id = ?
      `,
      [userId, skillId]
    );

    res.json({
      message: "Skill removed"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to remove skill",
      error: error.message
    });
  }
});

module.exports = router;