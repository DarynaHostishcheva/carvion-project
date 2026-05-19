const API_URL = "https://carvion-project.onrender.com/api";
const token = localStorage.getItem("carvionToken");

if (!token) {
  window.location.href = "auth.html";
}

const elements = {
  greeting: document.getElementById("dashboardGreeting"),
  profileView: document.getElementById("profileView"),
  profileForm: document.getElementById("profileForm"),
  profileName: document.getElementById("profileName"),
  profileStatus: document.getElementById("profileStatus"),
  profileDescription: document.getElementById("profileDescription"),
  profileNameInput: document.getElementById("profileNameInput"),
  profileStatusInput: document.getElementById("profileStatusInput"),
  profileDescriptionInput: document.getElementById("profileDescriptionInput"),
  editProfileBtn: document.getElementById("editProfileBtn"),
  cancelProfileBtn: document.getElementById("cancelProfileBtn"),
  compassSelect: document.getElementById("compassSelect"),
  addCompassBtn: document.getElementById("addCompassBtn"),
  skillsContainer: document.getElementById("skillsContainer"),
  quizContainer: document.getElementById("quizContainer"),
  professionContainer: document.getElementById("professionContainer"),
  logoutBtn: document.getElementById("logoutBtn")
};

let dashboardData = null;
let allSkills = [];

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

function clearSession() {
  localStorage.removeItem("carvionToken");
  localStorage.removeItem("carvionUser");
  localStorage.removeItem("carvionLoggedIn");
}

function renderEmpty(container, message) {
  container.innerHTML = `
    <p class="empty-state">
      ${message}
    </p>
  `;
}

async function loadDashboard() {
  dashboardData = await apiRequest("/dashboard");

  renderProfile();
  renderCompass();
  renderQuizzes();
  renderSavedProfessions();
}

async function loadAllSkills() {
  const data = await apiRequest("/dashboard/skills");
  allSkills = data.skills;

  renderCompassOptions();
}

function renderProfile() {
  const { user, profile } = dashboardData;

  elements.greeting.textContent = `Welcome back, ${user.name}!`;
  elements.profileName.textContent = user.name;
  elements.profileStatus.textContent = profile.status;
  elements.profileDescription.textContent = profile.description;
}

function openProfileEdit() {
  const { user, profile } = dashboardData;

  elements.profileNameInput.value = user.name;
  elements.profileStatusInput.value = profile.status;
  elements.profileDescriptionInput.value = profile.description;
  elements.profileView.classList.add("hidden");
  elements.profileForm.classList.remove("hidden");
  elements.editProfileBtn.classList.add("hidden");
}

function closeProfileEdit() {
  elements.profileForm.classList.add("hidden");
  elements.profileView.classList.remove("hidden");
  elements.editProfileBtn.classList.remove("hidden");
}

function renderCompassOptions() {
  const selectedIds = dashboardData
    ? dashboardData.compassSkills.map((skill) => skill.id)
    : [];

  elements.compassSelect.innerHTML = `
    <option value="">Choose skill or interest</option>
  `;

  allSkills
    .filter((skill) => !selectedIds.includes(skill.id))
    .forEach((skill) => {
      const option = document.createElement("option");

      option.value = skill.id;
      option.textContent = skill.name;

      elements.compassSelect.appendChild(option);
    });
}

function renderCompass() {
  const skills = dashboardData.compassSkills;
  elements.skillsContainer.innerHTML = "";

  if (!skills.length) {
    renderEmpty(elements.skillsContainer, "No skills or interests added yet.");
    renderCompassOptions();
    return;
  }

  skills.forEach((skill) => {
    const skillTag = document.createElement("div");

    skillTag.className = "skill-tag";
    skillTag.innerHTML = `
      ${skill.name}
      <span class="remove-skill" data-skill-id="${skill.id}">×</span>
    `;

    elements.skillsContainer.appendChild(skillTag);
  });

  renderCompassOptions();
}

function renderQuizzes() {
  const quizzes = dashboardData.completedQuizzes;
  elements.quizContainer.innerHTML = "";

  if (!quizzes.length) {
    renderEmpty(elements.quizContainer, "No completed quizzes yet.");
    return;
  }

  quizzes.forEach((quiz) => {
    const item = document.createElement("div");

    item.className = "quiz-item";
    item.innerHTML = `
      <h3>${quiz.title}</h3>
      <p class="quiz-completed">${quiz.status}</p>
    `;

    elements.quizContainer.appendChild(item);
  });
}

function renderSavedProfessions() {
  const careers = dashboardData.savedCareers;
  elements.professionContainer.innerHTML = "";

  if (!careers.length) {
    renderEmpty(
      elements.professionContainer,
      "No saved professions yet. Explore the career library and save professions that interest you."
    );
    return;
  }

  careers.forEach((career) => {
    const item = document.createElement("a");

    item.className = "profession-item";
    item.href = `career.html?id=${career.id}`;
    item.innerHTML = `
      <h3>${career.name}</h3>
      <p>${career.description}</p>
    `;

    elements.professionContainer.appendChild(item);
  });
}

elements.editProfileBtn.addEventListener("click", openProfileEdit);
elements.cancelProfileBtn.addEventListener("click", closeProfileEdit);
elements.profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  await apiRequest("/dashboard/profile", {
    method: "PUT",
    body: JSON.stringify({
      name: elements.profileNameInput.value.trim(),
      status: elements.profileStatusInput.value,
      description: elements.profileDescriptionInput.value.trim()
    })
  });

  await loadDashboard();
  closeProfileEdit();
});

elements.addCompassBtn.addEventListener("click", async () => {
  const skillId = Number(elements.compassSelect.value);

  if (!skillId) return;

  await apiRequest("/dashboard/skills", {
    method: "POST",
    body: JSON.stringify({ skillId })
  });

  await loadDashboard();
});

elements.skillsContainer.addEventListener("click", async (event) => {
  const removeButton = event.target.closest(".remove-skill");

  if (!removeButton) return;

  await apiRequest(`/dashboard/skills/${removeButton.dataset.skillId}`, {
    method: "DELETE"
  });

  await loadDashboard();
});

elements.logoutBtn.addEventListener("click", () => {
  clearSession();
  window.location.href = "index.html";
});

async function initDashboard() {
  try {
    await loadDashboard();
    await loadAllSkills();
  } catch (error) {
    alert(error.message);
    clearSession();
    window.location.href = "auth.html";
  }
}

initDashboard();