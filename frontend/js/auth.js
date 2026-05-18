const API_URL = "http://localhost:3000/api";

// =========================
// ELEMENTS
// =========================

const loginToggle = document.getElementById("loginToggle");
const signupToggle = document.getElementById("signupToggle");

const toggleSlider = document.getElementById("toggleSlider");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");

const submitBtn = document.getElementById("submitBtn");

const signupFields = document.querySelectorAll(".signup-only");

const authForm = document.getElementById("authForm");

let isSignup = false;

// =========================
// SWITCH TO SIGNUP
// =========================

signupToggle.addEventListener("click", () => {
  if (isSignup) return;

  isSignup = true;

  signupToggle.classList.add("active");
  loginToggle.classList.remove("active");

  toggleSlider.classList.add("signup");

  signupFields.forEach(field => {
    field.classList.remove("hidden-field");
  });

  authTitle.textContent = "Create your account";

  authSubtitle.textContent =
    "Start your ethical career journey with personalized guidance and community support.";

  submitBtn.querySelector("span").textContent =
    "Create Account";
});

// =========================
// SWITCH TO LOGIN
// =========================

loginToggle.addEventListener("click", () => {
  if (!isSignup) return;

  isSignup = false;

  loginToggle.classList.add("active");
  signupToggle.classList.remove("active");

  toggleSlider.classList.remove("signup");

  signupFields.forEach(field => {
    field.classList.add("hidden-field");
  });

  authTitle.textContent = "Shape your future!";

  authSubtitle.textContent =
    "Join a community of students and professionals building meaningful careers.";

  submitBtn.querySelector("span").textContent =
    "Log In";
});

// =========================
// HELPERS
// =========================

function saveAuthData(data) {
  localStorage.setItem("carvionToken", data.token);
  localStorage.setItem("carvionUser", JSON.stringify(data.user));

  // Temporary compatibility with older frontend logic.
  localStorage.setItem("carvionLoggedIn", "true");
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;

  submitBtn.querySelector("span").textContent =
    isLoading
      ? "Please wait..."
      : isSignup
        ? "Create Account"
        : "Log In";
}

async function sendAuthRequest(endpoint, payload) {
  const response = await fetch(`${API_URL}/auth/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Authentication failed");
  }

  return data;
}

// =========================
// FORM SUBMIT
// =========================

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value.trim();

  try {
    setLoading(true);

    if (isSignup) {
      const fullName =
        document.getElementById("fullName").value.trim();

      const repeatPassword =
        document.getElementById("repeatPassword").value.trim();

      if (!fullName || !email || !password || !repeatPassword) {
        throw new Error("Please fill all fields.");
      }

      if (password.length < 6) {
        throw new Error("Password must contain at least 6 characters.");
      }

      if (password !== repeatPassword) {
        throw new Error("Passwords do not match.");
      }

      const data = await sendAuthRequest("register", {
        name: fullName,
        email,
        password
      });

      saveAuthData(data);

      submitBtn.querySelector("span").textContent =
        "Success!";
    } else {
      if (!email || !password) {
        throw new Error("Please fill email and password.");
      }

      const data = await sendAuthRequest("login", {
        email,
        password
      });

      saveAuthData(data);

      submitBtn.querySelector("span").textContent =
        "Welcome back!";
    }

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 700);
  } catch (error) {
    alert(error.message);
    setLoading(false);
  }
});

// =========================
// AUTO REDIRECT
// =========================

const existingToken =
  localStorage.getItem("carvionToken");

if (existingToken) {
  console.log("User already has token");
}