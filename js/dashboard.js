const API_URL = "https://carvion-project.onrender.com/api";

const token =
  localStorage.getItem("carvionToken");

if (!token) {
  window.location.href = "auth.html";
}

// =========================
// API HELPERS
// =========================

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

// =========================
// STATE
// =========================

let dashboardData = null;
let allSkills = [];

// =========================
// ELEMENTS
// =========================

const dashboardGreeting =
  document.getElementById("dashboardGreeting");

const profileView =
  document.getElementById("profileView");

const profileForm =
  document.getElementById("profileForm");

const profileName =
  document.getElementById("profileName");

const profileStatus =
  document.getElementById("profileStatus");

const profileDescription =
  document.getElementById("profileDescription");

const profileNameInput =
  document.getElementById("profileNameInput");

const profileStatusInput =
  document.getElementById("profileStatusInput");

const profileDescriptionInput =
  document.getElementById("profileDescriptionInput");

const editProfileBtn =
  document.getElementById("editProfileBtn");

const cancelProfileBtn =
  document.getElementById("cancelProfileBtn");

const compassSelect =
  document.getElementById("compassSelect");

const addCompassBtn =
  document.getElementById("addCompassBtn");

const skillsContainer =
  document.getElementById("skillsContainer");

const quizContainer =
  document.getElementById("quizContainer");

const professionContainer =
  document.getElementById("professionContainer");

const logoutBtn =
  document.getElementById("logoutBtn");

// =========================
// LOAD DATA
// =========================

async function loadDashboard() {
  dashboardData =
    await apiRequest("/dashboard");

  renderProfile();
  renderCompass();
  renderQuizzes();
  renderSavedProfessions();
}

async function loadAllSkills() {
  const data =
    await apiRequest("/dashboard/skills");

  allSkills =
    data.skills;

  renderCompassOptions();
}

// =========================
// PROFILE
// =========================

function renderProfile() {
  const user =
    dashboardData.user;

  const profile =
    dashboardData.profile;

  dashboardGreeting.textContent =
    `Welcome back, ${user.name}!`;

  profileName.textContent =
    user.name;

  profileStatus.textContent =
    profile.status;

  profileDescription.textContent =
    profile.description;
}

function openProfileEdit() {
  const user =
    dashboardData.user;

  const profile =
    dashboardData.profile;

  profileView.classList.add("hidden");
  profileForm.classList.remove("hidden");

  profileNameInput.value =
    user.name;

  profileStatusInput.value =
    profile.status;

  profileDescriptionInput.value =
    profile.description;

  editProfileBtn.classList.add("hidden");
}

function closeProfileEdit() {
  profileForm.classList.add("hidden");
  profileView.classList.remove("hidden");
  editProfileBtn.classList.remove("hidden");
}

editProfileBtn.addEventListener("click", openProfileEdit);

cancelProfileBtn.addEventListener("click", closeProfileEdit);

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  await apiRequest("/dashboard/profile", {
    method: "PUT",
    body: JSON.stringify({
      name: profileNameInput.value.trim(),
      status: profileStatusInput.value,
      description: profileDescriptionInput.value.trim()
    })
  });

  await loadDashboard();

  closeProfileEdit();
});

// =========================
// COMPASS
// =========================

function renderCompassOptions() {
  const selectedSkillIds =
    dashboardData
      ? dashboardData.compassSkills.map(skill => skill.id)
      : [];

  compassSelect.innerHTML = `
    <option value="">Choose skill or interest</option>
  `;

  allSkills.forEach((skill) => {
    if (!selectedSkillIds.includes(skill.id)) {
      const option =
        document.createElement("option");

      option.value =
        skill.id;

      option.textContent =
        skill.name;

      compassSelect.appendChild(option);
    }
  });
}

function renderCompass() {
  skillsContainer.innerHTML = "";

  const skills =
    dashboardData.compassSkills;

  if (skills.length === 0) {
    skillsContainer.innerHTML = `
      <p class="empty-state">
        No skills or interests added yet.
      </p>
    `;

    renderCompassOptions();
    return;
  }

  skills.forEach((skill) => {
    const skillTag =
      document.createElement("div");

    skillTag.className =
      "skill-tag";

    skillTag.innerHTML = `
      ${skill.name}

      <span
        class="remove-skill"
        data-skill-id="${skill.id}"
      >
        ×
      </span>
    `;

    skillsContainer.appendChild(skillTag);
  });

  renderCompassOptions();
}

addCompassBtn.addEventListener("click", async () => {
  const skillId =
    Number(compassSelect.value);

  if (!skillId) {
    return;
  }

  await apiRequest("/dashboard/skills", {
    method: "POST",
    body: JSON.stringify({
      skillId
    })
  });

  await loadDashboard();
});

skillsContainer.addEventListener("click", async (event) => {
  const removeButton =
    event.target.closest(".remove-skill");

  if (!removeButton) {
    return;
  }

  const skillId =
    removeButton.dataset.skillId;

  await apiRequest(`/dashboard/skills/${skillId}`, {
    method: "DELETE"
  });

  await loadDashboard();
});

// =========================
// QUIZZES
// =========================

function renderQuizzes() {
  quizContainer.innerHTML = "";

  const quizzes =
    dashboardData.completedQuizzes;

  if (quizzes.length === 0) {
    quizContainer.innerHTML = `
      <p class="empty-state">
        No completed quizzes yet.
      </p>
    `;

    return;
  }

  quizzes.forEach((quiz) => {
    const item =
      document.createElement("div");

    item.className =
      "quiz-item";

    item.innerHTML = `
      <h3>${quiz.title}</h3>

      <p class="quiz-completed">
        ${quiz.status}
      </p>
    `;

    quizContainer.appendChild(item);
  });
}

// =========================
// PROFESSIONS
// =========================

function renderSavedProfessions() {
  professionContainer.innerHTML = "";

  const savedCareers =
    dashboardData.savedCareers;

  if (savedCareers.length === 0) {
    professionContainer.innerHTML = `
      <p class="empty-state">
        No saved professions yet. Explore the career library and save professions that interest you.
      </p>
    `;

    return;
  }

  savedCareers.forEach((career) => {
    const item =
      document.createElement("a");

    item.className =
      "profession-item";

    item.href =
      `career.html?id=${career.id}`;

    item.innerHTML = `
      <h3>${career.name}</h3>
      <p>${career.description}</p>
    `;

    professionContainer.appendChild(item);
  });
}

// =========================
// LOGOUT
// =========================

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("carvionToken");
  localStorage.removeItem("carvionUser");
  localStorage.removeItem("carvionLoggedIn");

  window.location.href = "index.html";
});

// =========================
// INIT
// =========================

async function initDashboard() {
  try {
    await loadDashboard();
    await loadAllSkills();
  } catch (error) {
    alert(error.message);

    localStorage.removeItem("carvionToken");
    localStorage.removeItem("carvionUser");
    localStorage.removeItem("carvionLoggedIn");

    window.location.href = "auth.html";
  }
}

initDashboard();