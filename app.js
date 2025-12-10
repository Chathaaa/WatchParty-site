const API_BASE = "https://watchparty-4u9v.onrender.com";
const CHAT_BASE = "https://chathaaa.github.io/WatchParty-site/room.html";


// Turn a roomId into { platform, label, url }
function describeRoom(roomId) {
  let platform = "WatchParty";
  let label = roomId;
  let url = null;

  // ESPN league games: espn-nba-401809510
  if (roomId.startsWith("espn-")) {
    const parts = roomId.split("-");
    // espn-watch-<id...>
    if (parts[1] === "watch") {
      platform = "ESPN Watch";
      const id = parts.slice(2).join("-");
      label = `ESPN Watch stream ${id}`;
      url = `https://www.espn.com/watch/player/_/id/${encodeURIComponent(id)}`;
    }
    // espn-event-<digits>
    else if (parts[1] === "event") {
      platform = "ESPN";
      const eventId = parts[2];
      label = `ESPN event ${eventId}`;
      url = `https://www.espn.com/watch/player/_/eventId/${encodeURIComponent(eventId)}`;
    }
    // espn-<league>-<gameId>
    else if (parts.length >= 3) {
      const league = parts[1].toLowerCase();
      const gameId = parts[2];
      platform = "ESPN";
      label = `${league.toUpperCase()} game ${gameId}`;
      url = `https://www.espn.com/${encodeURIComponent(league)}/game/_/gameId/${encodeURIComponent(gameId)}`;
    }
  }

  // Peacock live: peacock-live-<id>
  else if (roomId.startsWith("peacock-live-")) {
    platform = "Peacock";
    const id = roomId.slice("peacock-live-".length);
    label = `Peacock live channel ${id}`;
    url = `https://www.peacocktv.com/watch/playback/live/${encodeURIComponent(id)}`;
  }

  // Prime Video: prime-<id>
  else if (roomId.startsWith("prime-")) {
    platform = "Prime Video";
    const id = roomId.slice("prime-".length);
    label = `Prime Video title ${id}`;
    url = `https://www.amazon.com/gp/video/detail/${encodeURIComponent(id)}`;
  }

  return { platform, label, url };
}

// ---------- Live games list ----------
async function loadGames() {
  const list = document.getElementById("games-list");
  if (!list) return;

  list.innerHTML = `<p class="loading">Checking for live games…</p>`;

  try {
    const res = await fetch(`${API_BASE}/games`);
    const data = await res.json();
    const games = data.games || [];
    console.log("Live games:", games);

    if (games.length === 0) {
      list.innerHTML = `<p class="loading">No live games right now.</p>`;
      return;
    }

    list.innerHTML = "";
    games.forEach((g) => {
      const { platform, label, url } = describeRoom(g.roomId);

      const lastActive = g.lastActive
        ? new Date(g.lastActive).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      const metaBits = [];
      if (platform) metaBits.push(platform);
      if (typeof g.clients === "number") {
        metaBits.push(
          g.clients === 1 ? "1 person in chat" : `${g.clients} people in chat`
        );
      }
      if (lastActive) metaBits.push(`active ~ ${lastActive}`);

      const metaText = metaBits.join(" · ");

      const chatUrl = `${CHAT_BASE}?room=${encodeURIComponent(g.roomId)}`;

      div.innerHTML = `
        <div class="game-main">
          <div class="game-title">${label}</div>
          ${metaText ? `<div class="game-meta">${metaText}</div>` : ""}
        </div>
        <div class="game-room">
          ${url
            ? `<a class="cta-btn secondary game-link" href="${url}" target="_blank" rel="noopener">Open game ↗</a>`
            : ``
          }
          <a class="cta-btn ghost game-link" href="${chatUrl}" target="_blank" rel="noopener">
            Open chat 💬
          </a>
          ${!url ? `<div style="margin-top:4px;"><small>Room: <code>${g.roomId}</code></small></div>` : ""}
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

