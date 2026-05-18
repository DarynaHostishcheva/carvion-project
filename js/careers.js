const API_URL = "https://carvion-project.onrender.com/api";

/* =========================
   DOM
========================= */

const careersGrid =
  document.querySelector(".careers-grid");

const searchInput =
  document.querySelector(".search-input");

const industryFilters =
  document.getElementById("industryFilters");

/* =========================
   STATE
========================= */

let activeIndustry = "All";
let searchQuery = "";

/* =========================
   API
========================= */

async function fetchCareers() {
  const params =
    new URLSearchParams();

  if (searchQuery) {
    params.append("search", searchQuery);
  }

  if (activeIndustry !== "All") {
    params.append("category", activeIndustry);
  }

  const response =
    await fetch(`${API_URL}/careers?${params.toString()}`);

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load careers");
  }

  return data.careers;
}

async function fetchCategories() {
  const response =
    await fetch(`${API_URL}/careers/categories`);

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load categories");
  }

  return [
    "All",
    ...data.categories
  ];
}

/* =========================
   FILTERS
========================= */

function renderFilterButtons(categories) {
  industryFilters.innerHTML = "";

  categories.forEach((category) => {
    const button =
      document.createElement("button");

    button.className =
      "filter-btn";

    button.textContent =
      category;

    if (category === activeIndustry) {
      button.classList.add("active");
    }

    button.addEventListener("click", async () => {
      activeIndustry = category;

      await renderCareers();
      await renderCategories();
    });

    industryFilters.appendChild(button);
  });
}

async function renderCategories() {
  const categories =
    await fetchCategories();

  renderFilterButtons(categories);
}

/* =========================
   RENDER CAREERS
========================= */

async function renderCareers() {
  try {
    careersGrid.innerHTML = "";

    const careers =
      await fetchCareers();

    if (careers.length === 0) {
      careersGrid.innerHTML = `
        <div class="empty-state">
          <h3>No careers found</h3>
          <p>Try changing filters or search query.</p>
        </div>
      `;

      return;
    }

    careers.forEach((career, index) => {
      const card =
        document.createElement("a");

      card.className =
        "career-card";

      card.href =
        `career.html?id=${career.id}`;

      card.innerHTML = `
        <div class="career-top">
          <span class="career-badge">
            ${career.category}
          </span>
        </div>

        <h2>
          ${career.name}
        </h2>

        <p class="career-description">
          ${career.description}
        </p>

        <div class="career-footer">
          <span class="career-link">
            Learn more →
          </span>
        </div>
      `;

      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";

      careersGrid.appendChild(card);

      setTimeout(() => {
        card.style.transition = "0.45s ease";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, index * 40);
    });
  } catch (error) {
    careersGrid.innerHTML = `
      <div class="empty-state">
        <h3>Unable to load careers</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

/* =========================
   SEARCH
========================= */

let searchTimeout = null;

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(async () => {
    searchQuery =
      searchInput.value.trim();

    await renderCareers();
  }, 300);
});

/* =========================
   INIT
========================= */

async function initCareersPage() {
  await renderCategories();
  await renderCareers();

  document.body.classList.add("loaded");
}

initCareersPage();