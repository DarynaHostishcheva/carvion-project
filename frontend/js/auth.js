const API_URL = "https://carvion-project.onrender.com/api";

const loginToggle = document.getElementById("loginToggle");
const signupToggle = document.getElementById("signupToggle");
const toggleSlider = document.getElementById("toggleSlider");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const submitBtn = document.getElementById("submitBtn");
const authForm = document.getElementById("authForm");
const signupFields = document.querySelectorAll(".signup-only");

let isSignup = false;

function setAuthMode(nextMode) {
  isSignup = nextMode === "signup";

  loginToggle.classList.toggle("active", !isSignup);
  signupToggle.classList.toggle("active", isSignup);
  toggleSlider.classList.toggle("signup", isSignup);

  signupFields.forEach((field) => {
    field.classList.toggle("hidden-field", !isSignup);
  });

  authTitle.textContent = isSignup
    ? "Create your account"
    : "Shape your future!";

  authSubtitle.textContent = isSignup
    ? "Start your ethical career journey with personalized guidance and community support."
    : "Join a community of students and professionals building meaningful careers.";

  submitBtn.querySelector("span").textContent = isSignup
    ? "Create Account"
    : "Log In";
}

function saveAuthData(data) {
  localStorage.setItem("carvionToken", data.token);
  localStorage.setItem("carvionUser", JSON.stringify(data.user));
  localStorage.setItem("carvionLoggedIn", "true");
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;

  submitBtn.querySelector("span").textContent = isLoading
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

function getAuthPayload() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!isSignup) {
    if (!email || !password) {
      throw new Error("Please fill email and password.");
    }

    return {
      endpoint: "login",
      payload: { email, password }
    };
  }

  const fullName = document.getElementById("fullName").value.trim();
  const repeatPassword = document.getElementById("repeatPassword").value.trim();

  if (!fullName || !email || !password || !repeatPassword) {
    throw new Error("Please fill all fields.");
  }

  if (password.length < 6) {
    throw new Error("Password must contain at least 6 characters.");
  }

  if (password !== repeatPassword) {
    throw new Error("Passwords do not match.");
  }

  return {
    endpoint: "register",
    payload: {
      name: fullName,
      email,
      password
    }
  };
}

loginToggle.addEventListener("click", () => setAuthMode("login"));
signupToggle.addEventListener("click", () => setAuthMode("signup"));

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    setLoading(true);

    const { endpoint, payload } = getAuthPayload();
    const data = await sendAuthRequest(endpoint, payload);

    saveAuthData(data);

    submitBtn.querySelector("span").textContent = isSignup
      ? "Success!"
      : "Welcome back!";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 700);
  } catch (error) {
    alert(error.message);
    setLoading(false);
  }
});