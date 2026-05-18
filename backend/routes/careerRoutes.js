const express = require("express");

const pool = require("../database");
const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const category = req.query.category || "All";

    let sql = `
      SELECT id, name, description, category
      FROM Careers
      WHERE 1 = 1
    `;

    const params = [];

    if (search) {
      sql += `
        AND (
          name LIKE ?
          OR description LIKE ?
          OR category LIKE ?
        )
      `;

      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }

    if (category !== "All") {
      sql += " AND category = ?";
      params.push(category);
    }

    sql += " ORDER BY name ASC";

    const [careers] = await pool.query(sql, params);

    res.json({
      careers
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load careers",
      error: error.message
    });
  }
});

router.get("/categories", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT category
      FROM Careers
      WHERE category IS NOT NULL
      ORDER BY category ASC
    `);

    res.json({
      categories: rows.map(row => row.category)
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load categories",
      error: error.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const careerId = req.params.id;

    const [careers] = await pool.query(
      `
        SELECT id, name, description, category
        FROM Careers
        WHERE id = ?
      `,
      [careerId]
    );

    if (careers.length === 0) {
      return res.status(404).json({
        message: "Career not found"
      });
    }

    const [skills] = await pool.query(
      `
        SELECT
          Skills.id,
          Skills.name,
          CareerSkills.weight
        FROM CareerSkills
        JOIN Skills
          ON Skills.id = CareerSkills.skill_id
        WHERE CareerSkills.career_id = ?
        ORDER BY Skills.name ASC
      `,
      [careerId]
    );

    res.json({
      career: {
        ...careers[0],
        skills
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load career",
      error: error.message
    });
  }
});

router.post("/:id/save", checkAuth, async (req, res) => {
  try {
    const careerId = req.params.id;
    const userId = req.user.id;

    await pool.query(
      `
        INSERT IGNORE INTO SavedCareers (user_id, career_id)
        VALUES (?, ?)
      `,
      [userId, careerId]
    );

    res.json({
      message: "Career saved"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save career",
      error: error.message
    });
  }
});

router.delete("/:id/save", checkAuth, async (req, res) => {
  try {
    const careerId = req.params.id;
    const userId = req.user.id;

    await pool.query(
      `
        DELETE FROM SavedCareers
        WHERE user_id = ?
        AND career_id = ?
      `,
      [userId, careerId]
    );

    res.json({
      message: "Career removed from saved"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to remove career",
      error: error.message
    });
  }
});

module.exports = router;