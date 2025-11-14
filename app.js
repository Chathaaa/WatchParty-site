const API_BASE = "https://watchparty-4u9v.onrender.com";

async function loadGames() {
  const list = document.getElementById("games-list");
  list.innerHTML = `<p class="loading">Checking for live games…</p>`;

  try {
    const res = await fetch(`${API_BASE}/games`);
    const data = await res.json();
    const games = data.games || [];
    console.log(games);

    if (games.length === 0) {
      list.innerHTML = `<p class="loading">No live games right now.</p>`;
      return;
    }

    list.innerHTML = "";
    games.forEach(g => {
      const div = document.createElement("div");
      div.className = "game-item";

      const title =
        g.title ||
        (g.home && g.away ? `${g.home} vs ${g.away}` : "Live game");

      const platform = g.platform || g.site || "";
      const league   = g.league || "";

      div.innerHTML = `
        <div class="game-main">
          <div class="game-title">${title}</div>
          ${
            platform || league
              ? `<div class="game-meta">${[league, platform].filter(Boolean).join(" · ")}</div>`
              : ""
          }
        </div>
        <div class="game-room">
          <small>Room: <code>${g.roomId}</code></small>
        </div>
      `;

      list.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    list.innerHTML = `<p class="loading">Error loading games.</p>`;
  }
}

loadGames();
setInterval(loadGames, 60000); // refresh every minute

// --- Feedback Modal ---
const modal = document.getElementById("feedback-modal");
const sendBtn = document.getElementById("feedback-send");
const closeBtn = document.getElementById("feedback-close");
const textBox = document.getElementById("feedback-text");
const statusMsg = document.getElementById("feedback-status");

// Triggered when user clicks "Tell us"
document.querySelector(".highlight")?.addEventListener("click", () => {
  modal.classList.remove("hidden");
  textBox.value = "";
  statusMsg.textContent = "";
  textBox.focus();
});

const footerFeedback = document.getElementById("footer-feedback");

footerFeedback?.addEventListener("click", (e) => {
  e.preventDefault(); // prevent the "#" link jump

  if (!modal) return;
  modal.classList.remove("hidden");

  if (textBox) {
    textBox.value = "";
    textBox.focus();
  }

  if (statusMsg) statusMsg.textContent = "";
});

// Close modal
closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Send feedback to backend
sendBtn.addEventListener("click", async () => {
  const message = textBox.value.trim();
  if (!message) return;

  statusMsg.textContent = "Sending...";

  try {
    await fetch("https://watchparty-4u9v.onrender.com/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    statusMsg.textContent = "Thanks! Got it.";

    // auto-close after short delay
    setTimeout(() => {
      modal.classList.add("hidden");
    }, 800);

  } catch (error) {
    console.error(error);
    statusMsg.textContent = "Error sending. Try again.";
  }
});

