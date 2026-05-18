const API_URL = "http://localhost:3000/api";

const token =
  localStorage.getItem("carvionToken");

if (!token) {
  window.location.href = "auth.html";
}

const params =
  new URLSearchParams(window.location.search);

const quizId =
  Number(params.get("id"));

let quiz = null;
let currentQuestionIndex = 0;
let selectedAnswerId = null;
const userAnswers = [];

/* =========================
   API HELPER
========================= */

async function apiRequest(endpoint, options = {}) {
  const response =
    await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

async function publicApiRequest(endpoint) {
  const response =
    await fetch(`${API_URL}${endpoint}`);

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

/* =========================
   LOAD QUIZ
========================= */

async function loadQuiz() {
  const data =
    await publicApiRequest(`/quizzes/${quizId}`);

  quiz =
    data.quiz;

  document.title =
    `${quiz.name} | Carvion`;
}

/* =========================
   RENDER QUIZ
========================= */

function renderQuiz() {
  const quizPage =
    document.getElementById("quizPage");

  const question =
    quiz.questions[currentQuestionIndex];

  const progress =
    ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  quizPage.innerHTML = `
    <section class="quiz-hero glass-card">
      <h1>${quiz.name}</h1>

      <p class="quiz-description">
        ${quiz.description}
      </p>
    </section>

    <section class="quiz-progress glass-card">
      <div class="progress-top">
        <span class="progress-label">
          Progress
        </span>

        <span class="progress-count">
          Question ${currentQuestionIndex + 1} / ${quiz.questions.length}
        </span>
      </div>

      <div class="progress-bar">
        <div
          class="progress-fill"
          style="width: ${progress}%"
        ></div>
      </div>
    </section>

    <section class="question-card glass-card">
      <h2 class="question-title">
        ${question.question}
      </h2>

      <div class="answers-list">
        ${question.answers.map((answer) => `
          <div
            class="answer-option ${
              selectedAnswerId === answer.id ? "selected" : ""
            }"
            data-answer-id="${answer.id}"
          >
            <span class="answer-label">
              ${answer.text}
            </span>

            <div class="answer-badge">
              ${answer.text.charAt(0)}
            </div>
          </div>
        `).join("")}
      </div>

      <button
        class="next-btn"
        id="nextBtn"
        disabled
      >
        ${
          currentQuestionIndex === quiz.questions.length - 1
            ? "Finish Quiz"
            : "Next Question"
        }
      </button>
    </section>
  `;

  attachEvents();
}

/* =========================
   EVENTS
========================= */

function attachEvents() {
  const options =
    document.querySelectorAll(".answer-option");

  const nextBtn =
    document.getElementById("nextBtn");

  options.forEach((option) => {
    option.addEventListener("click", () => {
      options.forEach(item => {
        item.classList.remove("selected");
      });

      option.classList.add("selected");

      selectedAnswerId =
        Number(option.dataset.answerId);

      nextBtn.disabled = false;
    });
  });

  nextBtn.addEventListener("click", nextQuestion);
}

/* =========================
   NEXT QUESTION
========================= */

async function nextQuestion() {
  const question =
    quiz.questions[currentQuestionIndex];

  userAnswers.push({
    questionId: question.id,
    answerId: selectedAnswerId
  });

  selectedAnswerId = null;

  if (currentQuestionIndex < quiz.questions.length - 1) {
    currentQuestionIndex++;
    renderQuiz();
    return;
  }

  await submitQuiz();
}

/* =========================
   SUBMIT QUIZ
========================= */

async function submitQuiz() {
  try {
    const data =
      await apiRequest(`/quizzes/${quiz.id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          answers: userAnswers
        })
      });

    renderResult(data);
  } catch (error) {
    renderError(error.message);
  }
}

/* =========================
   RESULT
========================= */

function renderResult(data) {
  const quizPage =
    document.getElementById("quizPage");

  const recommendations =
    data.recommendations || [];

  quizPage.innerHTML = `
    <section class="result-card glass-card">
      <div class="result-label">
        Your Result
      </div>

      <h2>
        ${data.result.title}
      </h2>

      <p>
        ${data.result.text}
      </p>

      ${
        recommendations.length
          ? `
            <div class="result-recommendations">
              ${recommendations.map(career => `
                <a
                  class="result-career"
                  href="career.html?id=${career.id}"
                >
                  <strong>${career.name}</strong>
                  <span>${career.category}</span>
                </a>
              `).join("")}
            </div>
          `
          : ""
      }

      <button
        class="next-btn"
        id="chatBtn"
      >
        Talk with Carvion AI
      </button>
    </section>
  `;

  document
    .getElementById("chatBtn")
    .addEventListener("click", () => {
      window.location.href = "chat.html";
    });
}

function renderError(message) {
  const quizPage =
    document.getElementById("quizPage");

  quizPage.innerHTML = `
    <section class="result-card glass-card">
      <div class="result-label">
        Error
      </div>

      <h2>
        Something went wrong
      </h2>

      <p>
        ${message}
      </p>
    </section>
  `;
}

/* =========================
   INIT
========================= */

async function initQuizPage() {
  try {
    if (!quizId) {
      throw new Error("Missing quiz id.");
    }

    await loadQuiz();

    renderQuiz();

    document.body.classList.add("loaded");
  } catch (error) {
    renderError(error.message);
    document.body.classList.add("loaded");
  }
}

initQuizPage();