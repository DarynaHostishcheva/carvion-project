const API_URL = "https://carvion-project.onrender.com/api";
const token = localStorage.getItem("carvionToken");

if (!token) {
  window.location.href = "auth.html";
}

const elements = {
  form: document.getElementById("chatForm"),
  input: document.getElementById("chatInput"),
  messages: document.getElementById("messagesContainer"),
  savedChats: document.getElementById("savedChats"),
  startScreen: document.getElementById("chatStart"),
  newChatBtn: document.getElementById("newChatBtn"),
  suggestionButtons: document.querySelectorAll(".suggestion-btn")
};

let chats = [];
let currentChatId = null;

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

function showStartScreen() {
  elements.messages.innerHTML = "";
  elements.startScreen.style.display = "block";
}

function hideStartScreen() {
  elements.startScreen.style.display = "none";
}

function createMessage(text, type) {
  const message = document.createElement("div");
  const bubble = document.createElement("div");

  message.classList.add("message", type);
  bubble.classList.add("bubble");
  bubble.textContent = text;

  message.appendChild(bubble);
  elements.messages.appendChild(message);

  elements.messages.scrollTop = elements.messages.scrollHeight;
}

function renderSavedChats() {
  elements.savedChats.innerHTML = "";

  if (!chats.length) {
    elements.savedChats.innerHTML = `
      <div class="empty-chats">
        No saved chats yet.
      </div>
    `;
    return;
  }

  chats.forEach((chat) => {
    const item = document.createElement("div");

    item.className = `chat-item ${chat.id === currentChatId ? "active" : ""}`;
    item.textContent = chat.title;

    item.addEventListener("click", () => loadChat(chat.id));

    elements.savedChats.appendChild(item);
  });
}

async function loadChats() {
  const data = await apiRequest("/chats");

  chats = data.chats;
  renderSavedChats();
}

async function loadChat(chatId) {
  const data = await apiRequest(`/chats/${chatId}`);

  currentChatId = data.chat.id;
  elements.messages.innerHTML = "";
  hideStartScreen();

  data.messages.forEach((message) => {
    createMessage(
      message.message,
      message.sender === "assistant" ? "ai" : "user"
    );
  });

  renderSavedChats();
}

async function createChat(title) {
  const data = await apiRequest("/chats", {
    method: "POST",
    body: JSON.stringify({ title })
  });

  currentChatId = data.chat.id;
}

async function sendMessage(text) {
  if (!text) return;

  try {
    if (!currentChatId) {
      await createChat(text.slice(0, 40));
    }

    hideStartScreen();
    createMessage(text, "user");
    elements.input.value = "";

    const data = await apiRequest(`/chats/${currentChatId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message: text })
    });

    createMessage(data.aiMessage.message, "ai");
    await loadChats();
  } catch (error) {
    alert(error.message);
  }
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(elements.input.value.trim());
});

elements.newChatBtn.addEventListener("click", () => {
  currentChatId = null;
  showStartScreen();
  renderSavedChats();
  elements.input.focus();
});

elements.suggestionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    sendMessage(button.textContent.trim());
  });
});

async function initChatPage() {
  try {
    await loadChats();
  } catch (error) {
    alert(error.message);
    window.location.href = "auth.html";
  } finally {
    document.body.classList.add("loaded");
  }
}

initChatPage();