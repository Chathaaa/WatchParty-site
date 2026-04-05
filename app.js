const API_BASE = "https://syncsong-2lxp.onrender.com";
const CHAT_BASE = "https://chathaaa.github.io/WatchParty-site/room.html";

function describeRoom(roomId) {
  let platform = "WatchParty";
  let label = roomId;
  let url = null;

  if (roomId.startsWith("espn-")) {
    const parts = roomId.split("-");
    if (parts[1] === "watch") {
      platform = "ESPN Watch";
      const id = parts.slice(2).join("-");
      label = `ESPN Watch stream ${id}`;
      url = `https://www.espn.com/watch/player/_/id/${encodeURIComponent(id)}`;
    } else if (parts[1] === "event") {
      platform = "ESPN";
      const eventId = parts[2];
      label = `ESPN event ${eventId}`;
      url = `https://www.espn.com/watch/player/_/eventId/${encodeURIComponent(eventId)}`;
    } else if (parts.length >= 3) {
      const league = parts[1].toLowerCase();
      const gameId = parts[2];
      platform = "ESPN";
      label = `${league.toUpperCase()} game ${gameId}`;
      url = `https://www.espn.com/${encodeURIComponent(league)}/game/_/gameId/${encodeURIComponent(gameId)}`;
    }
  } else if (roomId.startsWith("peacock-live-")) {
    platform = "Peacock";
    const id = roomId.slice("peacock-live-".length);
    label = `Peacock live channel ${id}`;
    url = `https://www.peacocktv.com/watch/playback/live/${encodeURIComponent(id)}`;
  } else if (roomId.startsWith("prime-")) {
    platform = "Prime Video";
    const id = roomId.slice("prime-".length);
    label = `Prime Video title ${id}`;
    url = `https://www.amazon.com/gp/video/detail/${encodeURIComponent(id)}`;
  }

  return { platform, label, url };
}

function createLink(className, href, text) {
  const link = document.createElement("a");
  link.className = className;
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = text;
  return link;
}

function renderGameCard(game) {
  const { platform, label, url } = describeRoom(game.roomId);
  const chatUrl = `${CHAT_BASE}?room=${encodeURIComponent(game.roomId)}`;

  const wrapper = document.createElement("div");
  wrapper.className = "game-item";

  const main = document.createElement("div");
  main.className = "game-main";

  const title = document.createElement("div");
  title.className = "game-title";
  title.textContent = label;
  main.appendChild(title);

  const metaBits = [];
  if (platform) metaBits.push(platform);
  if (typeof game.clients === "number") {
    metaBits.push(game.clients === 1 ? "1 person in chat" : `${game.clients} people in chat`);
  }
  if (game.lastActive) {
    const lastActive = new Date(game.lastActive).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    metaBits.push(`active ~ ${lastActive}`);
  }

  if (metaBits.length) {
    const meta = document.createElement("div");
    meta.className = "game-meta";
    meta.textContent = metaBits.join(" · ");
    main.appendChild(meta);
  }

  const actions = document.createElement("div");
  actions.className = "game-room";

  if (url) {
    actions.appendChild(createLink("cta-btn secondary game-link", url, "Open game ↗"));
  } else {
    const roomMeta = document.createElement("div");
    roomMeta.style.marginTop = "4px";
    const small = document.createElement("small");
    small.textContent = "Room: ";
    const code = document.createElement("code");
    code.textContent = game.roomId;
    small.appendChild(code);
    actions.appendChild(roomMeta);
    roomMeta.appendChild(small);
  }

  actions.appendChild(createLink("cta-btn ghost game-link", chatUrl, "Open chat 💬"));

  wrapper.appendChild(main);
  wrapper.appendChild(actions);

  return wrapper;
}

async function loadGames() {
  const list = document.getElementById("games-list");
  if (!list) return;

  list.innerHTML = '<p class="loading">Checking for live games…</p>';

  try {
    const res = await fetch(`${API_BASE}/games`);
    if (!res.ok) throw new Error(`Failed to load games (${res.status})`);

    const data = await res.json();
    const games = Array.isArray(data.games) ? data.games : [];

    if (games.length === 0) {
      list.innerHTML = '<p class="loading">No live games right now.</p>';
      return;
    }

    list.innerHTML = "";
    games.forEach((game) => {
      list.appendChild(renderGameCard(game));
    });
  } catch (err) {
    console.error(err);
    list.innerHTML = '<p class="loading">Error loading games.</p>';
  }
}

loadGames();
setInterval(loadGames, 60000);

const modal = document.getElementById("feedback-modal");
const sendBtn = document.getElementById("feedback-send");
const closeBtn = document.getElementById("feedback-close");
const textBox = document.getElementById("feedback-text");
const statusMsg = document.getElementById("feedback-status");

function openFeedbackModal() {
  if (!modal || !textBox || !statusMsg) return;
  modal.classList.remove("hidden");
  textBox.value = "";
  statusMsg.textContent = "";
  textBox.focus();
}

document.querySelector(".highlight")?.addEventListener("click", openFeedbackModal);

document.getElementById("footer-feedback")?.addEventListener("click", (e) => {
  e.preventDefault();
  openFeedbackModal();
});

closeBtn?.addEventListener("click", () => {
  modal?.classList.add("hidden");
});

sendBtn?.addEventListener("click", async () => {
  const message = textBox?.value.trim() || "";
  if (!message || !statusMsg) return;

  statusMsg.textContent = "Sending...";

  try {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      throw new Error(`Feedback request failed (${res.status})`);
    }

    statusMsg.textContent = "Thanks! Got it.";
    setTimeout(() => {
      modal?.classList.add("hidden");
    }, 800);
  } catch (error) {
    console.error(error);
    statusMsg.textContent = "Error sending. Try again.";
  }
});
