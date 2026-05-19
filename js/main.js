const navbar = document.querySelector(".navbar");
const actionBtn = document.querySelector(".nav-action-btn");
const loginLink = document.querySelector(".login-link");
const heroBtn = document.querySelector(".hero-btn");
const token = localStorage.getItem("carvionToken");

if (navbar) {
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  });
}

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