const express = require("express");

const pool = require("../database");
const checkAuth = require("../middleware/checkAuth");
const {
  calculateRecommendations
} = require("../services/recommendationService");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [quizzes] = await pool.query(
      `
        SELECT id, name, description
        FROM Quizzes
        ORDER BY id ASC
      `
    );

    res.json({
      quizzes
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load quizzes",
      error: error.message
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const quizId = req.params.id;

    const [quizzes] = await pool.query(
      `
        SELECT id, name, description
        FROM Quizzes
        WHERE id = ?
      `,
      [quizId]
    );

    if (quizzes.length === 0) {
      return res.status(404).json({
        message: "Quiz not found"
      });
    }

    const [questions] = await pool.query(
      `
        SELECT id, question, category
        FROM QuizQuestions
        WHERE quiz_id = ?
        ORDER BY id ASC
      `,
      [quizId]
    );

    const questionIds =
      questions.map(question => question.id);

    let answers = [];

    if (questionIds.length) {
      const [answerRows] = await pool.query(
        `
          SELECT id, question_id, text
          FROM QuizAnswers
          WHERE question_id IN (?)
          ORDER BY id ASC
        `,
        [questionIds]
      );

      answers = answerRows;
    }

    const questionsWithAnswers =
      questions.map((question) => ({
        ...question,
        answers: answers.filter(
          answer => answer.question_id === question.id
        )
      }));

    res.json({
      quiz: {
        ...quizzes[0],
        questions: questionsWithAnswers
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load quiz",
      error: error.message
    });
  }
});

router.post("/:id/submit", checkAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const quizId = Number(req.params.id);
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        message: "Answers are required"
      });
    }

    await pool.query(
      `
        DELETE FROM UserAnswers
        WHERE user_id = ?
        AND question_id IN (
          SELECT id
          FROM QuizQuestions
          WHERE quiz_id = ?
        )
      `,
      [userId, quizId]
    );

    for (const item of answers) {
      await pool.query(
        `
          INSERT INTO UserAnswers
            (user_id, question_id, answer_id)
          VALUES (?, ?, ?)
        `,
        [
          userId,
          item.questionId,
          item.answerId
        ]
      );
    }

    const answerIds =
      answers.map(item => item.answerId);

    const recommendations =
      await calculateRecommendations(userId, answerIds);

    const resultTitle =
      recommendations.length
        ? "Career matches generated"
        : "No strong match found";

    const resultText =
      recommendations.length
        ? "Your answers were analyzed through skill matching and compared with career profiles."
        : "Your answers were saved, but no strong career match was found.";

    await pool.query(
      `
        INSERT INTO UserQuizResults
          (user_id, quiz_id, result_title, result_text, status)
        VALUES (?, ?, ?, ?, 'Completed')
      `,
      [
        userId,
        quizId,
        resultTitle,
        resultText
      ]
    );

    const careerIds =
      recommendations.map(item => item.careerId);

    let careers = [];

    if (careerIds.length) {
      const [careerRows] = await pool.query(
        `
          SELECT id, name, description, category
          FROM Careers
          WHERE id IN (?)
        `,
        [careerIds]
      );

      careers =
        recommendations.map((item) => ({
          ...careerRows.find(
            career => career.id === item.careerId
          ),
          score: item.score
        }));
    }

    res.json({
      message: "Quiz submitted successfully",
      result: {
        title: resultTitle,
        text: resultText
      },
      recommendations: careers
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit quiz",
      error: error.message
    });
  }
});

module.exports = router;