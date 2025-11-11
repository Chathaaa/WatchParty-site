// ----- Config -----
const DEFAULT_WS = location.protocol === "https:"
  ? "wss://watchparty-4u9v.onrender.com"
  : "ws://localhost:3000";

function getWsBase() {
  return localStorage.getItem("watchparty_ws") || DEFAULT_WS;
}

// For server health we can hit the HTTPS health endpoint from your WS base
function wsToHttpHealth(wsBase) {
  try {
    const u = new URL(wsBase);
    u.protocol = (u.protocol === "wss:") ? "https:" : "http:";
    u.pathname = "/health";
    u.search = "";
    return u.toString();
  } catch { return null; }
}

// ----- Health check -----
async function checkHealth() {
  const dot = document.getElementById("health-dot");
  const text = document.getElementById("health-text");
  const url = wsToHttpHealth(getWsBase());
  if (!url) {
    dot.className = "dot dot-red";
    text.textContent = "Bad WS URL";
    return;
  }
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      dot.className = "dot dot-green";
      text.textContent = "Server is online";
    } else {
      dot.className = "dot dot-red";
      text.textContent = "Server unreachable";
    }
  } catch {
    dot.className = "dot dot-red";
    text.textContent = "Server unreachable";
  }
}

// ----- URL → platform + roomId (mirrors your extension logic) -----
function parseGame(urlStr) {
  let url;
  try { url = new URL(urlStr); } catch { return null; }

  const host = url.hostname;

  // Peacock: /watch/playback/live/<digits>
  if (host.endsWith("peacocktv.com")) {
    const m = /^\/watch\/playback\/live\/(\d+)(?:\/|$)/.exec(url.pathname);
    if (m) return { platform: "Peacock", roomId: `peacock-live-${m[1]}`, gameUrl: url.toString() };
  }

  // ESPN (standard game): /<league>/game/_/gameId/<digits>...
  if (host.endsWith("espn.com")) {
    const m1 = /^\/([a-z]+)\/game\/_\/gameId\/(\d+)(?:\/|$)/i.exec(url.pathname);
    if (m1) return { platform: "ESPN", roomId: `espn-${m1[1].toLowerCase()}-${m1[2]}`, gameUrl: url.toString() };
    // ESPN Watch player: /watch/player/_/id/<uuid>
    const m2 = /^\/watch\/player\/_\/id\/([A-Za-z0-9-]+)(?:\/|$)/.exec(url.pathname);
    if (m2) return { platform: "ESPN Watch", roomId: `espn-watch-${m2[1]}`, gameUrl: url.toString() };
  }

  // Prime Video: /gp/video/detail/<alphanum>
  if (host.endsWith("amazon.com")) {
    const m = /^\/gp\/video\/detail\/([A-Za-z0-9]+)(?:\/|$)/.exec(url.pathname);
    if (m) return { platform: "Prime Video", roomId: `prime-${m[1]}`, gameUrl: url.toString() };
  }

  return null;
}

// ----- UI wiring -----
document.getElementById("year").textContent = new Date().getFullYear();

function refreshWsUI() {
  document.getElementById("wsCurrent").textContent = getWsBase();
  document.getElementById("wsInput").value = getWsBase();
}

document.getElementById("saveWs").addEventListener("click", () => {
  const v = document.getElementById("wsInput").value.trim();
  if (v) localStorage.setItem("watchparty_ws", v);
  else localStorage.removeItem("watchparty_ws");
  refreshWsUI();
  checkHealth();
});

document.getElementById("resetWs").addEventListener("click", () => {
  localStorage.removeItem("watchparty_ws");
  refreshWsUI();
  checkHealth();
});

document.getElementById("checkBtn").addEventListener("click", () => {
  const inp = document.getElementById("urlInput");
  const parsed = parseGame(inp.value);
  const res = document.getElementById("result");
  const platformVal = document.getElementById("platformVal");
  const roomVal = document.getElementById("roomVal");
  const openLink = document.getElementById("openLink");
  const copyParam = document.getElementById("copyParam");

  if (!parsed) {
    res.classList.remove("hidden");
    platformVal.textContent = "Not supported";
    roomVal.textContent = "–";
    openLink.href = "#";
    openLink.classList.remove("btn-primary");
    openLink.classList.add("btn");
    copyParam.onclick = () => {};
    return;
  }

  res.classList.remove("hidden");
  platformVal.textContent = parsed.platform;
  roomVal.textContent = parsed.roomId;

  // Open the raw game URL
  openLink.href = parsed.gameUrl;
  openLink.classList.add("btn-primary");

  // Copy the ?wpRoom param for forcing overlay anywhere
  copyParam.onclick = async () => {
    const param = `?wpRoom=${encodeURIComponent(parsed.roomId)}`;
    try {
      await navigator.clipboard.writeText(param);
      copyParam.textContent = "Copied!";
      setTimeout(() => (copyParam.textContent = 'Copy ?wpRoom=… override'), 1200);
    } catch {
      alert(param);
    }
  };
});

// Init
refreshWsUI();
checkHealth();
