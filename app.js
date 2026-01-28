const $ = (id) => document.getElementById(id);

const state = {
  code: null,
  playerId: null,
  name: null,
  room: null,
  remaining: null,
  pollHandle: null
};

function toast(msg) {
  const t = $("toast");
  t.hidden = false;
  t.textContent = msg;
  clearTimeout(t._h);
  t._h = setTimeout(() => (t.hidden = true), 2200);
}

function api(path, body) {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  }).then(async (r) => {
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || "Request failed");
    return j;
  });
}

function buildBoard(el, guesses, results) {
  el.innerHTML = "";
  for (let r = 0; r < 6; r++) {
    const row = document.createElement("div");
    row.className = "row5";
    const g = guesses?.[r] || "";
    const res = results?.[r] || [];
    for (let c = 0; c < 5; c++) {
      const cell = document.createElement("div");
      cell.className = "cell " + (res[c] || "");
      cell.textContent = (g[c] || "");
      row.appendChild(cell);
    }
    el.appendChild(row);
  }
}

function render() {
  const room = state.room;

  $("roomPill").textContent = state.code ? `Room: ${state.code}` : "No room";

  const mode = $("mode").value;
  $("wordBox").style.display = (mode === "custom") ? "block" : "none";

  if (!room) {
    $("statusText").textContent = "Create or join a room.";
    $("startBtn").disabled = true;
    $("guess").disabled = true;
    $("guessBtn").disabled = true;
    $("timerBox").textContent = "--";
    $("scoreboard").innerHTML = "";
    buildBoard($("yourBoard"), [], []);
    buildBoard($("oppBoard"), [], []);
    return;
  }

  const you = room.players[state.playerId];
  const oppId = state.playerId === "host" ? "guest" : "host";
  const opp = room.players[oppId];

  $("youTitle").textContent = `You (${you?.name || ""})`;
  $("oppTitle").textContent = opp ? `Opponent (${opp.name})` : "Opponent (waiting…)";

  buildBoard($("yourBoard"), you?.guesses, you?.results);
  buildBoard($("oppBoard"), opp?.guesses, opp?.results);

  const rem = (room.status === "running") ? (state.remaining ?? 0) : null;
  $("timerBox").textContent = room.status === "running"
    ? `⏱ ${rem}s`
    : (room.status === "finished" ? "Finished" : "Lobby");

  $("scoreboard").innerHTML = "";
  ["host","guest"].forEach((pid) => {
    const p = room.players[pid];
    if (!p) return;
    const div = document.createElement("div");
    div.className = "score";
    div.innerHTML = `
      <div class="name">${pid === "host" ? "Host" : "Guest"} — ${escapeHtml(p.name)}</div>
      <div class="sub">
        Ready: ${p.ready ? "✅" : "❌"} ·
        Score: <b>${p.score}</b> ·
        Guesses: ${p.guesses.length}/6
      </div>
    `;
    $("scoreboard").appendChild(div);
  });

  const canStart = state.playerId === "host"
    && room.status === "lobby"
    && !!room.players.guest
    && room.players.host.ready
    && room.players.guest.ready;

  $("startBtn").disabled = !canStart;

  const canGuess = room.status === "running";
  $("guess").disabled = !canGuess;
  $("guessBtn").disabled = !canGuess;

  $("statusText").textContent =
    room.status === "lobby" ? "Lobby: set ready. Host can start when both ready."
    : room.status === "running" ? "Game on. Type a 5-letter guess."
    : "Game finished. Create a new room to play again.";
}

async function poll() {
  if (!state.code) return;
  try {
    const r = await fetch(`/api/state?code=${encodeURIComponent(state.code)}`);
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Poll failed");
    state.room = j.room;
    state.remaining = j.remaining;
    render();
  } catch (e) {
    toast(e.message);
  }
}

function startPolling() {
  clearInterval(state.pollHandle);
  state.pollHandle = setInterval(poll, 1000);
  poll();
}

$("mode").addEventListener("change", render);

$("createBtn").addEventListener("click", async () => {
  try {
    const name = $("name").value.trim() || "Player";
    const j = await api("/api/create", { name });
    state.code = j.code;
    state.playerId = j.playerId;
    state.name = j.name;
    $("code").value = state.code;
    toast(`Room created: ${state.code}`);
    startPolling();
  } catch (e) { toast(e.message); }
});

$("joinBtn").addEventListener("click", async () => {
  try {
    const code = $("code").value.trim().toUpperCase();
    const name = $("name").value.trim() || "Player";
    const j = await api("/api/join", { code, name });
    state.code = j.code;
    state.playerId = j.playerId;
    state.name = j.name;
    toast(`Joined room: ${state.code}`);
    startPolling();
  } catch (e) { toast(e.message); }
});

$("readyBtn").addEventListener("click", async () => {
  try {
    if (!state.code) return toast("Create/join first.");

    const mode = $("mode").value;
    const timerSeconds = Number($("timer").value || 120);

    const payload = { code: state.code, playerId: state.playerId, mode, timerSeconds };
    if (mode === "custom") payload.word = $("word").value.trim();

    const j = await api("/api/setWord", payload);
    state.room = j.room;
    toast("Ready set ✅");
    render();
  } catch (e) { toast(e.message); }
});

$("startBtn").addEventListener("click", async () => {
  try {
    await api("/api/start", { code: state.code, playerId: state.playerId });
    toast("Started!");
    poll();
  } catch (e) { toast(e.message); }
});

$("guessBtn").addEventListener("click", submitGuess);
$("guess").addEventListener("keydown", (e) => {
  if (e.key === "Enter") submitGuess();
});

async function submitGuess() {
  try {
    const g = $("guess").value.trim();
    if (!g) return;
    const j = await api("/api/guess", { code: state.code, playerId: state.playerId, guess: g });
    $("guess").value = "";
    if (j.won) toast("You solved it! 🔥");
    else toast("Guess submitted");
    state.room = j.room;
    render();
  } catch (e) { toast(e.message); }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

render();
