const $ = (id) => document.getElementById(id);

const state = {
  code: null,
  playerId: null,
  name: null,
  room: null,
  remaining: null,
  pollHandle: null,
  view: "you" // you / opp
};

let typed = "";

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

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function buildBoard(el, guesses, results, N) {
  el.innerHTML = "";
  for (let r = 0; r < 6; r++) {
    const row = document.createElement("div");
    row.className = "row5";
    row.style.gridTemplateColumns = `repeat(${N}, 1fr)`;

    const g = guesses?.[r] || "";
    const res = results?.[r] || [];

    for (let c = 0; c < N; c++) {
      const cell = document.createElement("div");
      cell.className = "cell " + (res[c] || "");
      cell.textContent = (g[c] || "");
      row.appendChild(cell);
    }
    el.appendChild(row);
  }
}

/* ======= LENGTH (per player) ======= */
function yourLen() {
  const room = state.room;
  if (!room) return 5;
  if (room.wordLengths && room.wordLengths[state.playerId]) return room.wordLengths[state.playerId];
  return room.wordLength || 5;
}
function oppLen() {
  const room = state.room;
  const oppId = state.playerId === "host" ? "guest" : "host";
  if (!room) return 5;
  if (room.wordLengths && room.wordLengths[oppId]) return room.wordLengths[oppId];
  return room.wordLength || 5;
}

/* ======= Keyboard ======= */
function pressKey(ch) {
  if (!state.room || state.room.status !== "running") return;
  const N = yourLen();
  if (typed.length >= N) return;
  typed += ch.toLowerCase();
  render();
}
function backspace() {
  if (!state.room || state.room.status !== "running") return;
  typed = typed.slice(0, -1);
  render();
}
async function submitTyped() {
  if (!state.room || state.room.status !== "running") return;
  const N = yourLen();
  if (typed.length !== N) return toast(`Need ${N} letters`);
  $("guess").value = typed;
  typed = "";
  await submitGuess();
}

function buildKeyboard() {
  const kb = $("kb");
  kb.innerHTML = "";

  const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const mkBtn = (label, cls, onClick) => {
    const b = document.createElement("button");
    b.className = "kbBtn " + (cls || "");
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  };

  const r1 = document.createElement("div");
  r1.className = "kbRow";
  [...rows[0]].forEach(ch => r1.appendChild(mkBtn(ch, "", () => pressKey(ch))));
  kb.appendChild(r1);

  const r2 = document.createElement("div");
  r2.className = "kbRow mid";
  [...rows[1]].forEach(ch => r2.appendChild(mkBtn(ch, "", () => pressKey(ch))));
  kb.appendChild(r2);

  const r3 = document.createElement("div");
  r3.className = "kbRow bot";
  r3.appendChild(mkBtn("ENTER", "wide", () => submitTyped()));
  [...rows[2]].forEach(ch => r3.appendChild(mkBtn(ch, "", () => pressKey(ch))));
  r3.appendChild(mkBtn("⌫", "wide", () => backspace()));
  kb.appendChild(r3);
}

/* ======= Tabs + modals ======= */
$("tabYou").addEventListener("click", () => {
  state.view = "you";
  $("tabYou").classList.add("active");
  $("tabOpp").classList.remove("active");
  $("youWrap").style.display = "block";
  $("oppWrap").style.display = "none";
});
$("tabOpp").addEventListener("click", () => {
  state.view = "opp";
  $("tabOpp").classList.add("active");
  $("tabYou").classList.remove("active");
  $("oppWrap").style.display = "block";
  $("youWrap").style.display = "none";
});

$("showScoresBtn").addEventListener("click", () => {
  if (!state.room) return toast("Open ☰ to create/join first");
  $("scoresModal").hidden = false;
});
$("closeScoresBtn").addEventListener("click", () => $("scoresModal").hidden = true);
$("scoresModal").addEventListener("click", (e) => {
  if (e.target === $("scoresModal")) $("scoresModal").hidden = true;
});

$("menuBtn").addEventListener("click", () => $("menuModal").hidden = false);
$("menuCloseBtn").addEventListener("click", () => $("menuModal").hidden = true);
$("menuModal").addEventListener("click", (e) => {
  if (e.target === $("menuModal")) $("menuModal").hidden = true;
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $("scoresModal").hidden = true;
    $("menuModal").hidden = true;
  }
});

/* ======= Poll ======= */
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

/* ======= Render ======= */
function render() {
  const room = state.room;

  $("roomPill").textContent = state.code ? `Room: ${state.code}` : "No room";

  if (!room) {
    $("statusText").textContent = "Open ☰ → create/join a room.";
    $("scoresModal").hidden = true;
    $("rematchBtn").style.display = "none";
    $("gameSub").textContent = "Open ☰ to create/join.";
    $("timerBox").textContent = "--";
    $("vsLine").textContent = "—";
    buildBoard($("yourBoard"), [], [], 5);
    buildBoard($("oppBoard"), [], [], 5);
    return;
  }

  const isHost = state.playerId === "host";
  const you = room.players[state.playerId];
  const oppId = state.playerId === "host" ? "guest" : "host";
  const opp = room.players[oppId];

  // host sync UI
  $("mode").value = room.mode;
  $("timer").value = room.timerSeconds;
  $("mode").disabled = !isHost;
  $("timer").disabled = !isHost;

  $("wordBox").style.display = (room.mode === "custom") ? "block" : "none";

  // VS line
  const youName = you?.name || "You";
  const oppName = opp?.name || "Waiting…";
  $("vsLine").textContent = `${youName} vs ${oppName}`;

  // Timer
  const rem = (room.status === "running") ? (state.remaining ?? 0) : null;
  $("timerBox").textContent =
    room.status === "running" ? `⏱ ${rem}s`
    : room.status === "finished" ? "Finished"
    : "Lobby";

  // Boards (different lengths allowed)
  const Nyou = yourLen();
  const Nopp = oppLen();

  const youGuesses = (you?.guesses || []).slice();
  const youResults = (you?.results || []).slice();
  if (room.status === "running" && !you?.finishedAt && youGuesses.length < 6) {
    youGuesses[youGuesses.length] = typed;
    youResults[youResults.length] = Array(Nyou).fill("");
  }

  buildBoard($("yourBoard"), youGuesses, youResults, Nyou);
  buildBoard($("oppBoard"), opp?.guesses, opp?.results, Nopp);

  // Scores modal content
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

  // Game subtitle
  if (room.status === "running") {
    $("gameSub").textContent = `Guess exactly ${Nyou} letters.`;
  } else if (room.status === "finished" && room.reveal) {
    const yourWord = state.playerId === "host" ? room.reveal.host : room.reveal.guest;
    const oppWord  = state.playerId === "host" ? room.reveal.guest : room.reveal.host;
    $("gameSub").textContent = `Finished. Your word: ${String(yourWord).toUpperCase()} • Opponent: ${String(oppWord).toUpperCase()}`;
  } else {
    $("gameSub").textContent = "Lobby: set ready in ☰.";
  }

  // Start button enable
  const canStart =
    isHost &&
    room.status === "lobby" &&
    !!room.players.guest &&
    room.players.host.ready &&
    room.players.guest.ready;

  $("startBtn").disabled = !canStart;

  // Rematch button always visible when finished (host only)
  if (room.status === "finished") {
    $("rematchBtn").style.display = "block";
    $("rematchBtn").disabled = !isHost;
  } else {
    $("rematchBtn").style.display = "none";
  }
}

/* ======= Host changes mode/timer ======= */
$("mode").addEventListener("change", async () => {
  if (!state.code || state.playerId !== "host") return render();
  try {
    await api("/api/config", {
      code: state.code,
      playerId: state.playerId,
      mode: $("mode").value,
      timerSeconds: Number($("timer").value || 120)
    });
    toast("Settings updated ✅");
    typed = "";
    poll();
  } catch (e) { toast(e.message); }
});

$("timer").addEventListener("change", async () => {
  if (!state.code || state.playerId !== "host") return;
  try {
    await api("/api/config", {
      code: state.code,
      playerId: state.playerId,
      mode: $("mode").value,
      timerSeconds: Number($("timer").value || 120)
    });
    toast("Timer updated ✅");
    poll();
  } catch (e) { toast(e.message); }
});

/* ======= create/join ======= */
$("createBtn").addEventListener("click", async () => {
  try {
    const name = $("name").value.trim() || "Player";
    const j = await api("/api/create", { name });
    state.code = j.code;
    state.playerId = j.playerId;
    state.name = j.name;
    $("code").value = state.code;
    toast(`Room created: ${state.code}`);
    typed = "";
    $("menuModal").hidden = true; // go straight to game
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
    typed = "";
    $("menuModal").hidden = true; // go straight to game
    startPolling();
  } catch (e) { toast(e.message); }
});

/* ======= ready ======= */
$("readyBtn").addEventListener("click", async () => {
  try {
    if (!state.code) return toast("Open ☰ first.");

    const payload = {
      code: state.code,
      playerId: state.playerId,
      mode: state.room?.mode || $("mode").value,
      timerSeconds: Number(state.room?.timerSeconds || $("timer").value || 120)
    };

    if (payload.mode === "custom") payload.word = $("word").value.trim();

    const j = await api("/api/setWord", payload);
    state.room = j.room;
    toast("Ready set ✅");
    typed = "";
    render();
  } catch (e) { toast(e.message); }
});

/* ======= start ======= */
$("startBtn").addEventListener("click", async () => {
  try {
    await api("/api/start", { code: state.code, playerId: state.playerId });
    toast("Started!");
    typed = "";
    $("menuModal").hidden = true;
    poll();
  } catch (e) { toast(e.message); }
});

/* ======= guess ======= */
async function submitGuess() {
  try {
    const g = $("guess").value.trim();
    if (!g) return;
    const j = await api("/api/guess", { code: state.code, playerId: state.playerId, guess: g });
    $("guess").value = "";
    toast(j.won ? "Solved! 🔥" : "Submitted");
    state.room = j.room;
    render();
  } catch (e) { toast(e.message); }
}

/* ======= rematch ======= */
$("rematchBtn").addEventListener("click", async () => {
  try {
    await api("/api/rematch", { code: state.code, playerId: state.playerId });
    toast("Rematch: set ready again ✅");
    typed = "";
    poll();
  } catch (e) { toast(e.message); }
});

/* physical keyboard */
window.addEventListener("keydown", (e) => {
  if (!state.room || state.room.status !== "running") return;
  if (e.key === "Enter") return submitTyped();
  if (e.key === "Backspace") return backspace();
  if (/^[a-zA-Z]$/.test(e.key)) return pressKey(e.key.toUpperCase());
});

buildKeyboard();
render();
