// =========================
// NAVBAR SCROLL EFFECT
// =========================

const navbar =
  document.querySelector(".navbar");

if (navbar) {
  window.addEventListener("scroll", () => {
    navbar.classList.toggle(
      "scrolled",
      window.scrollY > 20
    );
  });
}

// =========================
// AUTH STATE
// =========================

const actionBtn =
  document.querySelector(".nav-action-btn");

const loginLink =
  document.querySelector(".login-link");

const heroBtn =
  document.querySelector(".hero-btn");

const token =
  localStorage.getItem("carvionToken");

if (token) {
  if (actionBtn) {
    actionBtn.textContent = "My Dashboard";
    actionBtn.href = "dashboard.html";
  }

  if (heroBtn) {
    heroBtn.textContent = "Go to Dashboard";
    heroBtn.href = "dashboard.html";
  }

  if (loginLink) {
    loginLink.style.display = "none";
  }
}