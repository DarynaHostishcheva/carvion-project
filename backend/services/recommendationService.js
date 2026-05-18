const pool = require("../database");

function cosineSimilarity(userVector, careerVector) {
  let dotProduct = 0;
  let userMagnitude = 0;
  let careerMagnitude = 0;

  const skillIds = new Set([
    ...Object.keys(userVector),
    ...Object.keys(careerVector)
  ]);

  skillIds.forEach((skillId) => {
    const userValue = userVector[skillId] || 0;
    const careerValue = careerVector[skillId] || 0;

    dotProduct += userValue * careerValue;
    userMagnitude += userValue * userValue;
    careerMagnitude += careerValue * careerValue;
  });

  if (userMagnitude === 0 || careerMagnitude === 0) {
    return 0;
  }

  return dotProduct / (
    Math.sqrt(userMagnitude) * Math.sqrt(careerMagnitude)
  );
}

async function buildUserSkillVector(answerIds) {
  if (!answerIds.length) {
    return {};
  }

  const [rows] = await pool.query(
    `
      SELECT skill_id, SUM(weight) AS total_weight
      FROM AnswerSkills
      WHERE answer_id IN (?)
      GROUP BY skill_id
    `,
    [answerIds]
  );

  const vector = {};

  rows.forEach((row) => {
    vector[row.skill_id] = Number(row.total_weight);
  });

  return vector;
}

async function saveUserSkills(userId, userVector) {
  const entries = Object.entries(userVector);

  for (const [skillId, weight] of entries) {
    await pool.query(
      `
        INSERT INTO UserSkills (user_id, skill_id, source, weight)
        VALUES (?, ?, 'quiz', ?)
        ON DUPLICATE KEY UPDATE
          weight = VALUES(weight),
          source = 'quiz'
      `,
      [userId, skillId, weight]
    );
  }
}

async function getCareerVectors() {
  const [rows] = await pool.query(
    `
      SELECT career_id, skill_id, weight
      FROM CareerSkills
    `
  );

  const careerVectors = {};

  rows.forEach((row) => {
    if (!careerVectors[row.career_id]) {
      careerVectors[row.career_id] = {};
    }

    careerVectors[row.career_id][row.skill_id] =
      Number(row.weight);
  });

  return careerVectors;
}

async function calculateRecommendations(userId, answerIds) {
  const userVector =
    await buildUserSkillVector(answerIds);

  await saveUserSkills(userId, userVector);

  const careerVectors =
    await getCareerVectors();

  const recommendations =
    Object.entries(careerVectors)
      .map(([careerId, careerVector]) => ({
        careerId: Number(careerId),
        score: cosineSimilarity(userVector, careerVector)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

  await pool.query(
    `
      DELETE FROM UserResults
      WHERE user_id = ?
    `,
    [userId]
  );

  for (const item of recommendations) {
    await pool.query(
      `
        INSERT INTO UserResults (user_id, career_id, score)
        VALUES (?, ?, ?)
      `,
      [userId, item.careerId, item.score]
    );
  }

  return recommendations;
}

module.exports = {
  calculateRecommendations
};