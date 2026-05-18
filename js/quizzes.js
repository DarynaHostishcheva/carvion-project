const API_URL = "http://localhost:3000/api";

/* =========================
   DOM
========================= */

const quizzesGrid =
  document.querySelector(".quizzes-grid");

/* =========================
   API
========================= */

async function fetchQuizzes() {
  const response =
    await fetch(`${API_URL}/quizzes`);

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load quizzes");
  }

  return data.quizzes;
}

/* =========================
   RENDER QUIZZES
========================= */

function renderQuizCards(quizzes) {
  quizzesGrid.innerHTML = "";

  if (quizzes.length === 0) {
    quizzesGrid.innerHTML = `
      <div class="empty-state">
        <h3>No quizzes found</h3>
        <p>Please try again later.</p>
      </div>
    `;

    return;
  }

  quizzes.forEach((quiz, index) => {
    const card =
      document.createElement("a");

    card.className =
      "quiz-card";

    card.href =
      `quiz.html?id=${quiz.id}`;

    card.innerHTML = `
      <h3>
        ${quiz.name}
      </h3>

      <p>
        ${quiz.description}
      </p>

      <div class="quiz-divider"></div>

      <span class="quiz-btn">
        Start Assessment
      </span>
    `;

    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";

    quizzesGrid.appendChild(card);

    setTimeout(() => {
      card.style.transition = "0.45s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, index * 90);
  });
}

/* =========================
   INIT
========================= */

async function initQuizzesPage() {
  try {
    const quizzes =
      await fetchQuizzes();

    renderQuizCards(quizzes);
  } catch (error) {
    quizzesGrid.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load quizzes</h3>
        <p>${error.message}</p>
      </div>
    `;
  }

  document.body.classList.add("loaded");
}

initQuizzesPage();