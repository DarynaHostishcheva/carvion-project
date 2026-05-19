const API_URL = "https://carvion-project.onrender.com/api";
const token = localStorage.getItem("carvionToken");

const params = new URLSearchParams(window.location.search);
const careerId = Number(params.get("id"));

let career = null;
let savedCareerIds = [];

function formatDescription(text) {
  if (!text) return "";

  const trimmed = text.trim();
  const endsCorrectly = /[.!?]$/.test(trimmed);

  return endsCorrectly ? trimmed : `${trimmed}...`;
}

async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (options.protected) {
    if (!token) {
      throw new Error("Please log in first.");
    }

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

function isCareerSaved(id) {
  return savedCareerIds.includes(id);
}

async function loadCareer() {
  const data = await apiRequest(`/careers/${careerId}`);
  career = data.career;
}

async function loadSavedCareers() {
  if (!token) {
    savedCareerIds = [];
    return;
  }

  const data = await apiRequest("/dashboard", {
    protected: true
  });

  savedCareerIds = data.savedCareers.map((item) => item.id);
}

function renderError(message) {
  document.getElementById("careerPage").innerHTML = `
    <section class="glass-card">
      <h1>Career not found</h1>
      <p class="section-text">${message}</p>
    </section>
  `;
}

function renderCareer() {
  const careerPage = document.getElementById("careerPage");
  const saved = isCareerSaved(career.id);

  document.title = `${career.name} | Carvion`;

  careerPage.innerHTML = `
    <section class="career-hero glass-card">
      <div class="career-hero-top">
        <div>
          <span class="career-category">${career.category}</span>
          <h1>${career.name}</h1>
        </div>

        <button
          class="save-career-btn ${saved ? "saved" : ""}"
          id="saveCareerBtn"
          type="button"
        >
          ${saved ? "Saved" : "Save Career"}
        </button>
      </div>
    </section>

    <section class="overview-card glass-card">
      <div class="section-header">
        <h2>Overview</h2>
        <span class="section-label">What is it?</span>
      </div>

      <p class="section-text">
        ${formatDescription(career.description)}
      </p>
    </section>

    <section class="skills-card glass-card">
      <h2>Skill Set</h2>

      <div class="skills-list">
        ${career.skills.map((skill) => `
          <div class="skill-pill">${skill.name}</div>
        `).join("")}
      </div>
    </section>
  `;

  document
    .getElementById("saveCareerBtn")
    .addEventListener("click", toggleSaveCareer);
}

async function toggleSaveCareer() {
  if (!token) {
    window.location.href = "auth.html";
    return;
  }

  try {
    const saved = isCareerSaved(career.id);

    await apiRequest(`/careers/${career.id}/save`, {
      method: saved ? "DELETE" : "POST",
      protected: true
    });

    savedCareerIds = saved
      ? savedCareerIds.filter((id) => id !== career.id)
      : [...savedCareerIds, career.id];

    renderCareer();
  } catch (error) {
    alert(error.message);
  }
}

async function initCareerPage() {
  try {
    if (!careerId) {
      throw new Error("Missing career id.");
    }

    await loadCareer();
    await loadSavedCareers();
    renderCareer();
  } catch (error) {
    renderError(error.message);
  } finally {
    document.body.classList.add("loaded");
  }
}

initCareerPage();