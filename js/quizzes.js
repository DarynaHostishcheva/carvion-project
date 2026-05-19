const API_URL = "https://carvion-project.onrender.com/api";
const quizzesGrid = document.querySelector(".quizzes-grid");

async function fetchQuizzes() {
  const response = await fetch(`${API_URL}/quizzes`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load quizzes");
  }

  return data.quizzes;
}

function renderEmptyState(title, text) {
  quizzesGrid.innerHTML = `
    <div class="empty-state">
      <h3>${title}</h3>
      <p>${text}</p>
    </div>
  `;
}

function createQuizCard(quiz, index) {
  const card = document.createElement("a");

  card.className = "quiz-card";
  card.href = `quiz.html?id=${quiz.id}`;
  card.innerHTML = `
    <h3>${quiz.name}</h3>

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

  setTimeout(() => {
    card.style.transition = "0.45s ease";
    card.style.opacity = "1";
    card.style.transform = "translateY(0)";
  }, index * 90);

  return card;
}

function renderQuizCards(quizzes) {
  quizzesGrid.innerHTML = "";

  if (!quizzes.length) {
    renderEmptyState("No quizzes found", "Please try again later.");
    return;
  }

  quizzes.forEach((quiz, index) => {
    quizzesGrid.appendChild(createQuizCard(quiz, index));
  });
}

async function initQuizzesPage() {
  try {
    const quizzes = await fetchQuizzes();
    renderQuizCards(quizzes);
  } catch (error) {
    renderEmptyState("Unable to load quizzes", error.message);
  } finally {
    document.body.classList.add("loaded");
  }
}

initQuizzesPage();