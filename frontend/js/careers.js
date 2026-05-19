const API_URL = "https://carvion-project.onrender.com/api";

const careersGrid = document.querySelector(".careers-grid");
const searchInput = document.querySelector(".search-input");
const industryFilters = document.getElementById("industryFilters");

let activeIndustry = "All";
let searchQuery = "";
let searchTimeout = null;

function formatDescription(text) {
  if (!text) return "";

  const trimmed = text.trim();
  const endsCorrectly = /[.!?]$/.test(trimmed);

  return endsCorrectly ? trimmed : `${trimmed}...`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

async function fetchCareers() {
  const params = new URLSearchParams();

  if (searchQuery) {
    params.append("search", searchQuery);
  }

  if (activeIndustry !== "All") {
    params.append("category", activeIndustry);
  }

  const data = await fetchJson(`${API_URL}/careers?${params.toString()}`);
  return data.careers;
}

async function fetchCategories() {
  const data = await fetchJson(`${API_URL}/careers/categories`);
  return ["All", ...data.categories];
}

function renderEmptyState(title, text) {
  careersGrid.innerHTML = `
    <div class="empty-state">
      <h3>${title}</h3>
      <p>${text}</p>
    </div>
  `;
}

function renderCategories(categories) {
  industryFilters.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");

    button.className = "filter-btn";
    button.textContent = category;
    button.classList.toggle("active", category === activeIndustry);

    button.addEventListener("click", async () => {
      activeIndustry = category;
      renderCategories(categories);
      await renderCareers();
    });

    industryFilters.appendChild(button);
  });
}

function createCareerCard(career, index) {
  const card = document.createElement("a");

  card.className = "career-card";
  card.href = `career.html?id=${career.id}`;
  card.innerHTML = `
    <div class="career-top">
      <span class="career-badge">${career.category}</span>
    </div>

    <h2>${career.name}</h2>

    <p class="career-description">
      ${formatDescription(career.description)}
    </p>

    <div class="career-footer">
      <span class="career-link">Learn more →</span>
    </div>
  `;

  card.style.opacity = "0";
  card.style.transform = "translateY(20px)";

  setTimeout(() => {
    card.style.transition = "0.45s ease";
    card.style.opacity = "1";
    card.style.transform = "translateY(0)";
  }, index * 40);

  return card;
}

async function renderCareers() {
  try {
    careersGrid.innerHTML = "";

    const careers = await fetchCareers();

    if (!careers.length) {
      renderEmptyState("No careers found", "Try changing filters or search query.");
      return;
    }

    careers.forEach((career, index) => {
      careersGrid.appendChild(createCareerCard(career, index));
    });
  } catch (error) {
    renderEmptyState("Unable to load careers", error.message);
  }
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(async () => {
    searchQuery = searchInput.value.trim();
    await renderCareers();
  }, 300);
});

async function initCareersPage() {
  try {
    const categories = await fetchCategories();

    renderCategories(categories);
    await renderCareers();
  } catch (error) {
    renderEmptyState("Unable to load careers", error.message);
  } finally {
    document.body.classList.add("loaded");
  }
}

initCareersPage();