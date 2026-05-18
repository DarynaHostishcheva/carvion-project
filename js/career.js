const API_URL = "http://localhost:3000/api";

const token =
  localStorage.getItem("carvionToken");

const params =
  new URLSearchParams(window.location.search);

const careerId =
  Number(params.get("id"));

let career = null;
let savedCareerIds = [];

// =========================
// API HELPERS
// =========================

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

async function protectedApiRequest(endpoint, options = {}) {
  if (!token) {
    throw new Error("Please log in first.");
  }

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

// =========================
// LOAD DATA
// =========================

async function loadCareer() {
  const data =
    await publicApiRequest(`/careers/${careerId}`);

  career =
    data.career;
}

async function loadSavedCareers() {
  if (!token) {
    savedCareerIds = [];
    return;
  }

  const data =
    await protectedApiRequest("/dashboard");

  savedCareerIds =
    data.savedCareers.map(item => item.id);
}

function isCareerSaved() {
  return savedCareerIds.includes(career.id);
}

// =========================
// RENDER
// =========================

function renderCareer() {
  const careerPage =
    document.getElementById("careerPage");

  document.title =
    `${career.name} | Carvion`;

  careerPage.innerHTML = `
    <section class="career-hero glass-card">

      <div class="career-hero-top">

        <div>
          <span class="career-category">
            ${career.category}
          </span>

          <h1>
            ${career.name}
          </h1>
        </div>

        <button
          class="save-career-btn ${isCareerSaved() ? "saved" : ""}"
          id="saveCareerBtn"
          type="button"
        >
          ${isCareerSaved() ? "Saved" : "Save Career"}
        </button>

      </div>

      <p class="hero-description">
        ${career.description}
      </p>

    </section>

    <section class="overview-card glass-card">

      <div class="section-header">
        <h2>Overview</h2>

        <span class="section-label">
          What is it?
        </span>
      </div>

      <p class="section-text">
        ${career.description}
      </p>

    </section>

    <div class="career-single-column">

      <section class="skills-card glass-card">

        <h2>Skill Set</h2>

        <div class="skills-list">
          ${career.skills.map(skill => `
            <div class="skill-pill">
              ${skill.name}
            </div>
          `).join("")}
        </div>

      </section>

    </div>
  `;

  const saveButton =
    document.getElementById("saveCareerBtn");

  saveButton.addEventListener("click", toggleSaveCareer);
}

// =========================
// SAVE / UNSAVE
// =========================

async function toggleSaveCareer() {
  try {
    if (!token) {
      window.location.href = "auth.html";
      return;
    }

    if (isCareerSaved()) {
      await protectedApiRequest(`/careers/${career.id}/save`, {
        method: "DELETE"
      });

      savedCareerIds =
        savedCareerIds.filter(id => id !== career.id);
    } else {
      await protectedApiRequest(`/careers/${career.id}/save`, {
        method: "POST"
      });

      savedCareerIds.push(career.id);
    }

    renderCareer();
  } catch (error) {
    alert(error.message);
  }
}

// =========================
// ERROR STATE
// =========================

function renderError(message) {
  const careerPage =
    document.getElementById("careerPage");

  careerPage.innerHTML = `
    <section class="glass-card">
      <h1>Career not found</h1>
      <p class="section-text">
        ${message}
      </p>
    </section>
  `;
}

// =========================
// INIT
// =========================

async function initCareerPage() {
  try {
    if (!careerId) {
      throw new Error("Missing career id.");
    }

    await loadCareer();
    await loadSavedCareers();

    renderCareer();

    document.body.classList.add("loaded");
  } catch (error) {
    renderError(error.message);
    document.body.classList.add("loaded");
  }
}

initCareerPage();