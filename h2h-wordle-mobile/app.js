const $ = (id) => document.getElementById(id);

const state = {
  code: null,
  playerId: null, // "host" | "guest"
  name: null,
  room: null,
  remaining: null,
  pollHandle: null,
  view: "you", // "you" | "opp"
  lastAnimatedRow: -1, // Track last animated row to prevent re-animation
  statsUpdated: false // Track if stats were updated for current game
};

let typed = "";
let lastSig = ""; // helps reduce "blink" by avoiding pointless re-renders

// ===== PVP STATS TRACKING =====
const defaultStats = {
  daily: { lastPlayed: null, currentStreak: 0, maxStreak: 0, totalGames: 0, wins: 0, guessDistribution: [0, 0, 0, 0, 0, 0] },
  endless: { totalGames: 0, wins: 0, guessDistribution: [0, 0, 0, 0, 0, 0] },
  pvp: { totalGames: 0, wins: 0, losses: 0, draws: 0, currentStreak: 0, maxStreak: 0 }
};

function loadStats() {
  const saved = localStorage.getItem('wordleStats');
  if (saved) {
    try {
      const stats = JSON.parse(saved);
      // Add pvp stats if not present (backwards compatibility)
      if (!stats.pvp) {
        stats.pvp = { totalGames: 0, wins: 0, losses: 0, draws: 0, currentStreak: 0, maxStreak: 0 };
      }
      return stats;
    } catch (e) {
      return { ...defaultStats };
    }
  }
  return { ...defaultStats };
}

function saveStats(stats) {
  localStorage.setItem('wordleStats', JSON.stringify(stats));
}

function updatePVPStats(won, draw) {
  const stats = loadStats();
  stats.pvp.totalGames++;
  
  if (draw) {
    stats.pvp.draws++;
    // Draw doesn't break streak but doesn't increase it
  } else if (won) {
    stats.pvp.wins++;
    stats.pvp.currentStreak++;
    stats.pvp.maxStreak = Math.max(stats.pvp.maxStreak, stats.pvp.currentStreak);
  } else {
    stats.pvp.losses++;
    stats.pvp.currentStreak = 0; // Loss resets streak
  }
  
  saveStats(stats);
  return stats;
}

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

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

/* ===== word lengths (per player) ===== */
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

/* ===== Board renderer (with animations) ===== */
function buildBoard(el, guesses, results, N, activeRowIndex = -1) {
  el.innerHTML = "";

  for (let r = 0; r < 6; r++) {
    const row = document.createElement("div");
    row.className = "row5" + (r === activeRowIndex ? " rowActive" : "");
    row.style.gridTemplateColumns = `repeat(${N}, 1fr)`;

    const g = guesses?.[r] || "";
    const res = results?.[r] || [];

    for (let c = 0; c < N; c++) {
      const cell = document.createElement("div");

      const ch = (g[c] || "");
      const cls = (res[c] || ""); // "", "g", "y", "b"

      cell.className = "cell " + cls + (ch ? "" : " empty");
      cell.textContent = ch;

      // typing pop (only for current typing row)
      if (cls === "" && ch && r === activeRowIndex) {
        cell.classList.add("pop");
      }

      // reveal flip (only on the most recently completed row, and only once)
      if (cls === "g" || cls === "y" || cls === "b") {
        const lastCompletedRow = guesses.length - 1;
        const shouldAnimate = r === lastCompletedRow && r > state.lastAnimatedRow;
        
        if (shouldAnimate) {
          cell.classList.add("reveal");
          cell.style.animationDelay = `${c * 70}ms`;
          
          // Update last animated row after animation completes
          if (c === N - 1) {
            setTimeout(() => {
              state.lastAnimatedRow = r;
            }, 70 * N + 350);
          }
        }
      }

      row.appendChild(cell);
    }

    el.appendChild(row);
  }
}

/* ===== Keyboard ===== */
function pressKey(ch) {
  if (!state.room || state.room.status !== "running") return;
  const N = yourLen();
  if (typed.length >= N) return;
  typed += ch.toLowerCase();
  render(true);
}
function backspace() {
  if (!state.room || state.room.status !== "running") return;
  typed = typed.slice(0, -1);
  render(true);
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
  r1.style.gridTemplateColumns = "repeat(10, 1fr)";
  [...rows[0]].forEach(ch => r1.appendChild(mkBtn(ch, "", () => pressKey(ch))));
  $("kb").appendChild(r1);

  const r2 = document.createElement("div");
  r2.className = "kbRow mid";
  r2.style.gridTemplateColumns = "repeat(9, 1fr)";
  [...rows[1]].forEach(ch => r2.appendChild(mkBtn(ch, "", () => pressKey(ch))));
  $("kb").appendChild(r2);

  const r3 = document.createElement("div");
  r3.className = "kbRow last";
  r3.style.gridTemplateColumns = "1.5fr repeat(7, 1fr) 1.5fr";
  r3.appendChild(mkBtn("ENTER", "wide", () => submitTyped()));
  [...rows[2]].forEach(ch => r3.appendChild(mkBtn(ch, "", () => pressKey(ch))));
  r3.appendChild(mkBtn("⌫", "wide", () => backspace()));
  $("kb").appendChild(r3);
}

/* ===== UI controls ===== */
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

$("menuBtn").addEventListener("click", () => $("menuModal").hidden = false);
$("menuCloseBtn").addEventListener("click", () => $("menuModal").hidden = true);
$("menuModal").addEventListener("click", (e) => {
  if (e.target === $("menuModal")) $("menuModal").hidden = true;
});

$("showScoresBtn").addEventListener("click", () => {
  if (!state.room) return toast("Open ☰ to create/join first");
  $("scoresModal").hidden = false;
});
$("closeScoresBtn").addEventListener("click", () => $("scoresModal").hidden = true);
$("scoresModal").addEventListener("click", (e) => {
  if (e.target === $("scoresModal")) $("scoresModal").hidden = true;
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $("scoresModal").hidden = true;
    $("menuModal").hidden = true;
  }
});

/* ===== Polling ===== */
async function poll() {
  if (!state.code) return;
  try {
    const r = await fetch(`/api/state?code=${encodeURIComponent(state.code)}`);
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Poll failed");
    state.room = j.room;
    state.remaining = j.remaining;

    // reduce unnecessary re-renders (helps “blink” feeling)
    const sig = JSON.stringify({
      s: state.room.status,
      h: state.room.players.host?.guesses,
      g: state.room.players.guest?.guesses,
      hr: state.room.players.host?.results,
      gr: state.room.players.guest?.results,
      rem: state.remaining,
      mode: state.room.mode,
      wl: state.room.wordLengths
    });

    if (sig !== lastSig) {
      lastSig = sig;
      render(false);
    }
  } catch (e) {
    toast(e.message);
  }
}

function startPolling() {
  clearInterval(state.pollHandle);
  state.pollHandle = setInterval(poll, 1000);
  poll();
}

/* ===== Render ===== */
function render(fromTyping) {
  const room = state.room;

  $("roomPill").textContent = state.code ? `Room: ${state.code}` : "No room";

  if (!room) {
    $("statusText").textContent = "Open ☰ → create/join a room.";
    $("scoresModal").hidden = true;
    $("rematchBtn").style.display = "none";
    $("gameSub").textContent = "Open ☰ to create/join.";
    $("timerBox").textContent = "--";
    $("vsLine").textContent = "—";
    $("winnerBanner").style.display = "none";
    buildBoard($("yourBoard"), [], [], 5, -1);
    buildBoard($("oppBoard"), [], [], 5, -1);
    return;
  }

  const isHost = state.playerId === "host";
  const you = room.players[state.playerId];
  const oppId = state.playerId === "host" ? "guest" : "host";
  const opp = room.players[oppId];

  // Winner banner
  if (room.status === "finished") {
    const hostP = room.players.host;
    const guestP = room.players.guest;
    
    if (hostP && guestP) {
      let winnerName = "";
      let isDraw = false;
      let youWon = false;
      
      if (hostP.score > guestP.score) {
        winnerName = hostP.name;
        youWon = (state.playerId === "host");
      } else if (guestP.score > hostP.score) {
        winnerName = guestP.name;
        youWon = (state.playerId === "guest");
      } else {
        isDraw = true;
      }
      
      // Update PVP stats (only once per game)
      if (!state.statsUpdated) {
        updatePVPStats(youWon, isDraw);
        state.statsUpdated = true;
      }
      
      if (isDraw) {
        $("winnerBanner").textContent = "🤝 IT'S A DRAW! 🤝";
        $("winnerBanner").style.display = "block";
      } else {
        $("winnerBanner").textContent = `🔥 ${winnerName.toUpperCase()} WON! 🔥`;
        $("winnerBanner").style.display = "block";
      }
    }
  } else {
    $("winnerBanner").style.display = "none";
  }

  // mode controls (host only)
  $("mode").value = room.mode;
  $("timer").value = room.timerSeconds;
  $("mode").disabled = !isHost;
  $("timer").disabled = !isHost;

  $("wordBox").style.display = (room.mode === "custom") ? "block" : "none";

  // VS line
  const youName = you?.name || "You";
  const oppName = opp?.name || "Waiting…";
  $("vsLine").textContent = `${youName} vs ${oppName}`;

  // timer
  const rem = (room.status === "running") ? (state.remaining ?? 0) : null;
  $("timerBox").textContent =
    room.status === "running" ? `⏱ ${rem}s`
    : room.status === "finished" ? "Finished"
    : "Lobby";

  // subtitle
  if (room.status === "running") {
    $("gameSub").textContent = `Guess exactly ${yourLen()} letters.`;
  } else if (room.status === "finished" && room.reveal) {
    const yourWord = state.playerId === "host" ? room.reveal.host : room.reveal.guest;
    const oppWord  = state.playerId === "host" ? room.reveal.guest : room.reveal.host;
    $("gameSub").textContent =
      `Finished. Your word: ${String(yourWord).toUpperCase()} • Opponent: ${String(oppWord).toUpperCase()}`;
  } else {
    $("gameSub").textContent = "Lobby: set ready in ☰.";
  }

  // Start enabled
  const canStart =
    isHost &&
    room.status === "lobby" &&
    !!room.players.guest &&
    room.players.host.ready &&
    room.players.guest.ready;

  $("startBtn").disabled = !canStart;

  // Rematch
  if (room.status === "finished") {
    $("rematchBtn").style.display = "block";
    $("rematchBtn").disabled = !isHost;
  } else {
    $("rematchBtn").style.display = "none";
  }

  // Boards (different lengths allowed)
  const Nyou = yourLen();
  const Nopp = oppLen();

  const youGuesses = (you?.guesses || []).slice();
  const youResults = (you?.results || []).slice();

  // show typed row ONLY while running & not finished
  if (room.status === "running" && !you?.finishedAt && youGuesses.length < 6) {
    youGuesses[youGuesses.length] = typed;
    youResults[youResults.length] = Array(Nyou).fill("");
  }

  const activeRow = (room.status === "running" && !you?.finishedAt) ? (you?.guesses?.length || 0) : -1;

  // If render triggered by typing, we still rebuild (safe), but animations won’t “blink” as much due to sig check.
  buildBoard($("yourBoard"), youGuesses, youResults, Nyou, activeRow);
  buildBoard($("oppBoard"), opp?.guesses, opp?.results, Nopp, -1);

  // Scores content
  $("scoreboard").innerHTML = "";
  ["host", "guest"].forEach((pid) => {
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
}

/* ===== Host updates mode/timer ===== */
$("mode").addEventListener("change", async () => {
  if (!state.code || state.playerId !== "host") return render(false);
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

/* ===== Create / Join ===== */
$("createBtn").addEventListener("click", async () => {
  try {
    const name = $("name").value.trim() || "Player";
    const j = await api("/api/create", { name });
    state.code = j.code;
    state.playerId = j.playerId;
    state.name = j.name;
    state.lastAnimatedRow = -1;
    $("code").value = state.code;
    toast(`Room created: ${state.code}`);
    typed = "";
    $("menuModal").hidden = true;
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
    state.lastAnimatedRow = -1;
    toast(`Joined room: ${state.code}`);
    typed = "";
    $("menuModal").hidden = true;
    startPolling();
  } catch (e) { toast(e.message); }
});

/* ===== Ready ===== */
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
    render(false);
  } catch (e) { toast(e.message); }
});

/* ===== Start ===== */
$("startBtn").addEventListener("click", async () => {
  try {
    await api("/api/start", { code: state.code, playerId: state.playerId });
    state.lastAnimatedRow = -1;
    state.statsUpdated = false; // Reset stats tracking for new game
    toast("Started!");
    typed = "";
    $("menuModal").hidden = true;
    poll();
  } catch (e) { toast(e.message); }
});

/* ===== Guess ===== */
async function submitGuess() {
  try {
    const g = $("guess").value.trim();
    if (!g) return;
    const j = await api("/api/guess", {
      code: state.code,
      playerId: state.playerId,
      guess: g
    });
    $("guess").value = "";
    toast(j.won ? "Solved! 🔥" : "Submitted");
    state.room = j.room;
    render(false);
  } catch (e) { toast(e.message); }
}

/* ===== Rematch ===== */
$("rematchBtn").addEventListener("click", async () => {
  try {
    await api("/api/rematch", { code: state.code, playerId: state.playerId });
    state.lastAnimatedRow = -1;
    state.statsUpdated = false; // Reset stats tracking for rematch
    toast("Rematch: set ready again ✅");
    typed = "";
    poll();
  } catch (e) { toast(e.message); }
});

/* ===== Physical keyboard support ===== */
window.addEventListener("keydown", (e) => {
  if (!state.room || state.room.status !== "running") return;
  if (e.key === "Enter") return submitTyped();
  if (e.key === "Backspace") return backspace();
  if (/^[a-zA-Z]$/.test(e.key)) return pressKey(e.key.toUpperCase());
});

buildKeyboard();
render(false);