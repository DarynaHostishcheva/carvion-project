const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../database");
const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters"
      });
    }

    const [existingUsers] = await pool.query(
      "SELECT id FROM Users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "User with this email already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO Users (email, password_hash, name) VALUES (?, ?, ?)",
      [email, passwordHash, name]
    );

    const userId = result.insertId;

    await pool.query(
      "INSERT INTO UserProfiles (user_id, status, description) VALUES (?, ?, ?)",
      [
        userId,
        "Exploring Options",
        "Career explorer passionate about discovering meaningful paths."
      ]
    );

    const user = {
      id: userId,
      email,
      name
    };

    const token = createToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const [users] = await pool.query(
      "SELECT id, email, password_hash, name FROM Users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = users[0];

    const passwordIsValid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = createToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
});

router.get("/me", checkAuth, async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, email, name FROM Users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      user: users[0]
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load user",
      error: error.message
    });
  }
});

module.exports = router;