/* =========================
   DOM
========================= */

const navLinks =
  document.getElementById("communityNavLinks");

const navActions =
  document.getElementById("communityNavActions");

/* =========================
   AUTH STATE
========================= */

const token =
  localStorage.getItem("carvionToken");

const isLoggedIn =
  Boolean(token);

/* =========================
   NAVBAR
========================= */

function renderNavbar() {
  if (isLoggedIn) {
    navLinks.innerHTML = `
      <a href="index.html">Home</a>

      <a href="community.html" class="active-link">
        Community
      </a>

      <a href="careers.html">Explore</a>

      <a href="quizzes.html">Quizzes</a>

      <a href="chat.html">Carvion AI</a>
    `;

    navActions.innerHTML = `
      <a href="dashboard.html" class="dashboard-btn">
        My Dashboard
      </a>
    `;

    return;
  }

  navLinks.innerHTML = `
    <a href="index.html">Home</a>

    <a href="community.html" class="active-link">
      Community
    </a>
  `;

  navActions.innerHTML = `
    <a href="auth.html" class="btn nav-action-btn">
      Get Started
    </a>
  `;
}

/* =========================
   SOCIAL BUTTONS
========================= */

document.querySelectorAll(".social-btn").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = "Coming Soon";
  });
});

/* =========================
   INIT
========================= */

renderNavbar();

window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});