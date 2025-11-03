/* DOM elements */
const chatForm   = document.getElementById("chatForm");
const userInput  = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const lastQ      = document.getElementById("lastQuestion");

/* Your Cloudflare Worker endpoint (no API key in browser!) */
const WORKER_URL = "https://apikey.vic-2-deguzman.workers.dev";

/* Conversation state (LevelUp: maintain history) */
const messages = [
  {
    role: "system",
    content:
      "You are a helpful assistant for L’Oréal. " +
      "Only answer questions related to L’Oréal products, ingredients, routines, and recommendations. " +
      "Politely refuse anything unrelated and redirect back to L’Oréal topics. " +
      "Be concise, friendly, and brand-appropriate."
  }
];

/* Seed greeting */
appendMsg("ai", "Bonjour! I’m your L’Oréal advisor. Ask about products, ingredients, or routines.");

/* Form handler */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  // Display the user's message
  appendMsg("user", text);

  // Show “last question above response”
  lastQ.textContent = `You asked: ${text}`;

  // Add to chat history
  messages.push({ role: "user", content: text });

  // Loading bubble
  const loadingId = appendMsg("ai", "…thinking…");

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages
      })
    });

    const data = await response.json();

    let reply = "Sorry, I couldn't get a response.";
    if (data && data.choices && data.choices[0]?.message?.content) {
      reply = data.choices[0].message.content.trim();
    } else if (data.error) {
      reply = `Error: ${data.error.message || "Upstream error"}`;
    }

    replaceMsg(loadingId, reply);
    messages.push({ role: "assistant", content: reply });
  } catch (err) {
    replaceMsg(loadingId, `Network error: ${err.message}`);
  } finally {
    userInput.value = "";
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});

/* ---------- UI helpers ---------- */
function appendMsg(type, text) {
  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.textContent = text;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return div;
}

function replaceMsg(nodeOrEl, newText) {
  const el = nodeOrEl instanceof HTMLElement ? nodeOrEl : null;
  if (el) el.textContent = newText;
}
