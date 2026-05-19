const navLinks = document.getElementById("communityNavLinks");
const navActions = document.getElementById("communityNavActions");
const isLoggedIn = Boolean(localStorage.getItem("carvionToken"));

function renderNavbar() {
  navLinks.innerHTML = isLoggedIn
    ? `
      <a href="index.html">Home</a>
      <a href="community.html" class="active-link">Community</a>
      <a href="careers.html">Explore</a>
      <a href="quizzes.html">Quizzes</a>
      <a href="chat.html">Carvion AI</a>
    `
    : `
      <a href="index.html">Home</a>
      <a href="community.html" class="active-link">Community</a>
    `;

  navActions.innerHTML = isLoggedIn
    ? `
      <a href="dashboard.html" class="dashboard-btn">
        My Dashboard
      </a>
    `
    : `
      <a href="auth.html" class="btn nav-action-btn">
        Get Started
      </a>
    `;
}

renderNavbar();

window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});