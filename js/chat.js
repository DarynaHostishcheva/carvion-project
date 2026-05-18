const API_URL = "https://carvion-project.onrender.com/api";

const token =
  localStorage.getItem("carvionToken");

if (!token) {
  window.location.href = "auth.html";
}

const form =
  document.getElementById("chatForm");

const input =
  document.getElementById("chatInput");

const messages =
  document.getElementById("messagesContainer");

const savedChats =
  document.getElementById("savedChats");

const startScreen =
  document.getElementById("chatStart");

const newChatBtn =
  document.getElementById("newChatBtn");

const suggestionButtons =
  document.querySelectorAll(".suggestion-btn");

let chats = [];
let currentChatId = null;

/* =========================
   API HELPER
========================= */

async function apiRequest(endpoint, options = {}) {
  const response =
    await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

/* =========================
   CHATS
========================= */

async function loadChats() {
  const data =
    await apiRequest("/chats");

  chats =
    data.chats;

  renderSavedChats();
}

function renderSavedChats() {
  savedChats.innerHTML = "";

  if (chats.length === 0) {
    savedChats.innerHTML = `
      <div class="empty-chats">
        No saved chats yet.
      </div>
    `;

    return;
  }

  chats.forEach((chat) => {
    const item =
      document.createElement("div");

    item.className =
      `chat-item ${chat.id === currentChatId ? "active" : ""}`;

    item.textContent =
      chat.title;

    item.addEventListener("click", () => {
      loadChat(chat.id);
    });

    savedChats.appendChild(item);
  });
}

async function createNewChat() {
  const data =
    await apiRequest("/chats", {
      method: "POST",
      body: JSON.stringify({
        title: "New chat"
      })
    });

  currentChatId =
    data.chat.id;

  messages.innerHTML = "";
  startScreen.style.display = "block";

  await loadChats();

  input.focus();
}

async function loadChat(chatId) {
  const data =
    await apiRequest(`/chats/${chatId}`);

  currentChatId =
    data.chat.id;

  messages.innerHTML = "";
  startScreen.style.display = "none";

  data.messages.forEach((message) => {
    createMessage(
      message.message,
      message.sender === "assistant" ? "ai" : "user"
    );
  });

  renderSavedChats();
}

/* =========================
   MESSAGES
========================= */

function createMessage(text, type) {
  const message =
    document.createElement("div");

  message.classList.add("message", type);

  const bubble =
    document.createElement("div");

  bubble.classList.add("bubble");

  bubble.textContent =
    text;

  message.appendChild(bubble);

  messages.appendChild(message);

  messages.scrollTop =
    messages.scrollHeight;
}

async function sendMessage(text) {
  if (!text) {
    return;
  }

  try {
    if (!currentChatId) {
      const data =
        await apiRequest("/chats", {
          method: "POST",
          body: JSON.stringify({
            title: text.slice(0, 40)
          })
        });

      currentChatId =
        data.chat.id;
    }

    startScreen.style.display = "none";

    createMessage(text, "user");

    input.value = "";

    const data =
      await apiRequest(`/chats/${currentChatId}/messages`, {
        method: "POST",
        body: JSON.stringify({
          message: text
        })
      });

    createMessage(data.aiMessage.message, "ai");

    await loadChats();
  } catch (error) {
    alert(error.message);
  }
}

/* =========================
   EVENTS
========================= */

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const text =
    input.value.trim();

  sendMessage(text);
});

newChatBtn.addEventListener("click", async () => {
  currentChatId = null;

  messages.innerHTML = "";

  startScreen.style.display = "block";

  input.focus();

  renderSavedChats();
});

suggestionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const text =
      button.textContent.trim();

    sendMessage(text);
  });
});

/* =========================
   INIT
========================= */

async function initChatPage() {
  try {
    await loadChats();

    document.body.classList.add("loaded");
  } catch (error) {
    alert(error.message);
    window.location.href = "auth.html";
  }
}

initChatPage();