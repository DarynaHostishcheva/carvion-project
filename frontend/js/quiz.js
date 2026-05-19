const API_URL = "https://carvion-project.onrender.com/api";
const token = localStorage.getItem("carvionToken");

if (!token) {
  window.location.href = "auth.html";
}

const params = new URLSearchParams(window.location.search);
const quizId = Number(params.get("id"));

let quiz = null;
let currentQuestionIndex = 0;
let selectedAnswerId = null;

const userAnswers = [];

async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (options.protected) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

async function loadQuiz() {
  const data = await apiRequest(`/quizzes/${quizId}`);

  quiz = data.quiz;
  document.title = `${quiz.name} | Carvion`;
}

function getCurrentQuestion() {
  return quiz.questions[currentQuestionIndex];
}

function renderAnswerOption(answer) {
  const selectedClass = selectedAnswerId === answer.id ? "selected" : "";

  return `
    <div
      class="answer-option ${selectedClass}"
      data-answer-id="${answer.id}"
    >
      <span class="answer-label">${answer.text}</span>
      <div class="answer-badge">${answer.text.charAt(0)}</div>
    </div>
  `;
}

function renderQuiz() {
  const quizPage = document.getElementById("quizPage");
  const question = getCurrentQuestion();
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  quizPage.innerHTML = `
    <section class="quiz-hero glass-card">
      <h1>${quiz.name}</h1>

      <p class="quiz-description">
        ${quiz.description}
      </p>
    </section>

    <section class="quiz-progress glass-card">
      <div class="progress-top">
        <span class="progress-label">Progress</span>
        <span class="progress-count">
          Question ${currentQuestionIndex + 1} / ${quiz.questions.length}
        </span>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
    </section>

    <section class="question-card glass-card">
      <h2 class="question-title">
        ${question.question}
      </h2>

      <div class="answers-list">
        ${question.answers.map(renderAnswerOption).join("")}
      </div>

      <button class="next-btn" id="nextBtn" disabled>
        ${isLastQuestion ? "Finish Quiz" : "Next Question"}
      </button>
    </section>
  `;

  attachQuestionEvents();
}

function attachQuestionEvents() {
  const options = document.querySelectorAll(".answer-option");
  const nextBtn = document.getElementById("nextBtn");

  options.forEach((option) => {
    option.addEventListener("click", () => {
      options.forEach((item) => item.classList.remove("selected"));

      option.classList.add("selected");
      selectedAnswerId = Number(option.dataset.answerId);
      nextBtn.disabled = false;
    });
  });

  nextBtn.addEventListener("click", nextQuestion);
}

async function nextQuestion() {
  const question = getCurrentQuestion();

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

async function submitQuiz() {
  try {
    const data = await apiRequest(`/quizzes/${quiz.id}/submit`, {
      method: "POST",
      protected: true,
      body: JSON.stringify({
        answers: userAnswers
      })
    });

    renderResult(data);
  } catch (error) {
    renderError(error.message);
  }
}

function renderRecommendations(recommendations = []) {
  if (!recommendations.length) return "";

  return `
    <div class="result-recommendations">
      ${recommendations.map((career) => `
        <a class="result-career" href="career.html?id=${career.id}">
          <strong>${career.name}</strong>
          <span>${career.category}</span>
        </a>
      `).join("")}
    </div>
  `;
}

function renderResult(data) {
  const quizPage = document.getElementById("quizPage");

  quizPage.innerHTML = `
    <section class="result-card glass-card">
      <div class="result-label">Your Result</div>

      <h2>${data.result.title}</h2>

      <p>
        ${data.result.text}
      </p>

      ${renderRecommendations(data.recommendations)}

      <button class="next-btn" id="chatBtn">
        Talk with Carvion AI
      </button>
    </section>
  `;

  document.getElementById("chatBtn").addEventListener("click", () => {
    window.location.href = "chat.html";
  });
}

function renderError(message) {
  document.getElementById("quizPage").innerHTML = `
    <section class="result-card glass-card">
      <div class="result-label">Error</div>
      <h2>Something went wrong</h2>
      <p>${message}</p>
    </section>
  `;
}

async function initQuizPage() {
  try {
    if (!quizId) {
      throw new Error("Missing quiz id.");
    }

    await loadQuiz();
    renderQuiz();
  } catch (error) {
    renderError(error.message);
  } finally {
    document.body.classList.add("loaded");
  }
}

initQuizPage();