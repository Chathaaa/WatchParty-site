const API_BASE = "https://watchparty-4u9v.onrender.com";

async function loadGames() {
  const list = document.getElementById("games-list");
  list.innerHTML = `<p class="loading">Checking for live games…</p>`;

  try {
    const res = await fetch(`${API_BASE}/games`);
    const games = await res.json();
    console.log(games);

    if (!games.length) {
      list.innerHTML = `<p class="loading">No live games right now.</p>`;
      return;
    }

    list.innerHTML = "";
    games.forEach(g => {
      const div = document.createElement("div");
      div.className = "game-item";
      div.innerHTML = `
        <strong>${g.league.toUpperCase()}</strong><br>
        ${g.title}<br>
        <small>Room: ${g.roomId}</small>
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
