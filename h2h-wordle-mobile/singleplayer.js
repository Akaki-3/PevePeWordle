import { getDailyWord, getRandomWord, isValidWord } from "./wordlist.js";

const $ = (id) => document.getElementById(id);

function pvpUrl(code, pid, name) {
  // ✅ PVP გვერდი არის singleplayer.html (სადაც app.js იტვირთება)
  const url = new URL("singleplayer.html", window.location.origin);
  url.searchParams.set("code", code);
  url.searchParams.set("pid", pid);
  url.searchParams.set("name", name);
  return url.toString();
}

// Game state
const state = {
  mode: null, // 'daily' or 'endless'
  word: "",
  length: 5,
  guesses: [],
  currentGuess: "",
  gameOver: false,
  won: false,
  keyboardState: {},
};

// Stats structure
const defaultStats = {
  daily: {
    lastPlayed: null,
    currentStreak: 0,
    maxStreak: 0,
    totalGames: 0,
    wins: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
  },
  endless: {
    totalGames: 0,
    wins: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
  },
  pvp: {
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    currentStreak: 0,
    maxStreak: 0,
  },
};

function loadStats() {
  const saved = localStorage.getItem("wordleStats");
  if (saved) {
    try {
      const stats = JSON.parse(saved);
      if (!stats.pvp) {
        stats.pvp = { ...defaultStats.pvp };
      }
      return stats;
    } catch {
      return { ...defaultStats };
    }
  }
  return { ...defaultStats };
}

function saveStats(stats) {
  localStorage.setItem("wordleStats", JSON.stringify(stats));
}

function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

function toast(message, duration = 2000) {
  const toastEl = $("toast");
  toastEl.textContent = message;
  toastEl.hidden = false;
  setTimeout(() => {
    toastEl.hidden = true;
  }, duration);
}

// ===== MODE SELECTION =====
function initModeSelector() {
  const stats = loadStats();
  updateStatsPreview(stats);

  $("dailyModeBtn").addEventListener("click", () => startDailyMode());
  $("endlessModeBtn").addEventListener("click", () => showLengthSelector());
  $("pvpModeBtn").addEventListener("click", () => {
    // გადადის PVP page-ზე
    window.location.href = "singleplayer.html";
  });

  const quickMatchBtn = $("quickMatchBtn");
  if (quickMatchBtn) quickMatchBtn.addEventListener("click", handleQuickMatch);

  const browseRoomsBtn = $("browseRoomsBtn");
  if (browseRoomsBtn) browseRoomsBtn.addEventListener("click", showPublicRoomsBrowser);
}

function updateStatsPreview(stats) {
  $("streakValue").textContent = stats.daily.currentStreak;

  const totalGames =
    stats.daily.totalGames + stats.endless.totalGames + (stats.pvp?.totalGames || 0);
  const totalWins = stats.daily.wins + stats.endless.wins + (stats.pvp?.wins || 0);
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  $("winRateValue").textContent = `${winRate}%`;
  $("gamesValue").textContent = totalGames;
}

function startDailyMode() {
  const stats = loadStats();
  const today = getTodayString();

  if (stats.daily.lastPlayed === today) {
    toast("You already played today! Try Endless Mode.", 3000);
    return;
  }

  state.mode = "daily";
  const dailyData = getDailyWord();
  state.word = dailyData.word;
  state.length = dailyData.length;

  initGame();
}

function showLengthSelector() {
  $("lengthModal").hidden = false;

  document.querySelectorAll(".lengthBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const length = parseInt(btn.dataset.length, 10);
      startEndlessMode(length);
      $("lengthModal").hidden = true;
    });
  });
}

function startEndlessMode(length) {
  state.mode = "endless";
  state.word = getRandomWord(length);
  state.length = length;
  initGame();
}

// ===== GAME INITIALIZATION =====
function initGame() {
  state.guesses = [];
  state.currentGuess = "";
  state.gameOver = false;
  state.won = false;
  state.keyboardState = {};

  $("modeSelector").style.display = "none";
  $("gameScreen").style.display = "flex";

  const stats = loadStats();
  $("gameMode").textContent = state.mode === "daily" ? "Daily Challenge" : "Endless Practice";
  $("wordLengthIndicator").textContent = `${state.length} letters`;
  $("currentStreak").textContent = stats.daily.currentStreak;
  updateGuessCounter();

  buildBoard();
  buildKeyboard();
  setupEventListeners();
}

function setupEventListeners() {
  $("backBtn").addEventListener("click", () => backToMenu());
  $("statsBtn").addEventListener("click", () => showStats());
  $("closeStatsBtn").addEventListener("click", () => ($("statsModal").hidden = true));
  $("resetStatsBtn").addEventListener("click", () => resetStats());
  $("playAgainBtn").addEventListener("click", () => playAgain());
  $("losePlayAgainBtn").addEventListener("click", () => playAgain());
  $("shareBtn").addEventListener("click", () => shareResults());

  document.addEventListener("keydown", handleKeyPress);
}

function backToMenu() {
  $("gameScreen").style.display = "none";
  $("modeSelector").style.display = "flex";
  document.removeEventListener("keydown", handleKeyPress);

  updateStatsPreview(loadStats());
}

function updateGuessCounter() {
  $("guessesUsed").textContent = state.guesses.length;
}

// ===== BOARD =====
function buildBoard() {
  const board = $("board");
  board.innerHTML = "";

  for (let i = 0; i < 6; i++) {
    const row = document.createElement("div");
    row.className = "boardRow";
    row.id = `row-${i}`;

    for (let j = 0; j < state.length; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.id = `cell-${i}-${j}`;
      row.appendChild(cell);
    }

    board.appendChild(row);
  }

  renderBoard();
}

function renderBoard() {
  for (let i = 0; i < state.guesses.length; i++) {
    const guess = state.guesses[i];
    const evaluation = evaluateGuess(guess);

    for (let j = 0; j < state.length; j++) {
      const cell = $(`cell-${i}-${j}`);
      cell.textContent = guess[j];
      cell.classList.add("filled", "revealed", evaluation[j]);
      cell.style.animationDelay = `${j * 0.1}s`;
    }
  }

  if (!state.gameOver && state.guesses.length < 6) {
    const currentRow = state.guesses.length;
    for (let j = 0; j < state.length; j++) {
      const cell = $(`cell-${currentRow}-${j}`);
      cell.textContent = state.currentGuess[j] || "";
      if (state.currentGuess[j]) cell.classList.add("filled");
      else cell.classList.remove("filled");
    }
  }
}

function evaluateGuess(guess) {
  const result = Array(state.length).fill("b");
  const wordArray = state.word.split("");
  const guessArray = guess.split("");
  const used = Array(state.length).fill(false);

  for (let i = 0; i < state.length; i++) {
    if (guessArray[i] === wordArray[i]) {
      result[i] = "g";
      used[i] = true;
      guessArray[i] = null;
    }
  }

  for (let i = 0; i < state.length; i++) {
    if (guessArray[i] === null) continue;

    const idx = wordArray.findIndex((letter, j) => !used[j] && letter === guessArray[i]);
    if (idx !== -1) {
      result[i] = "y";
      used[idx] = true;
    }
  }

  return result;
}

// ===== KEYBOARD =====
function buildKeyboard() {
  const kb = $("keyboard");
  kb.classList.add("kb");
  kb.innerHTML = "";

  const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  const mkBtn = (label, cls, onClick) => {
    const b = document.createElement("button");
    b.className = "key kbBtn " + (cls || "");
    b.dataset.key = label.length === 1 ? label.toLowerCase() : label;
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  };

  const r1 = document.createElement("div");
  r1.className = "kbRow";
  r1.style.gridTemplateColumns = "repeat(10, 1fr)";
  [...rows[0]].forEach((ch) => r1.appendChild(mkBtn(ch, "", () => handleKey(ch))));
  kb.appendChild(r1);

  const r2 = document.createElement("div");
  r2.className = "kbRow mid";
  r2.style.gridTemplateColumns = "repeat(9, 1fr)";
  [...rows[1]].forEach((ch) => r2.appendChild(mkBtn(ch, "", () => handleKey(ch))));
  kb.appendChild(r2);

  const r3 = document.createElement("div");
  r3.className = "kbRow last";
  r3.style.gridTemplateColumns = "1.5fr repeat(7, 1fr) 1.5fr";
  r3.appendChild(mkBtn("ENTER", "wide", () => handleKey("ENTER")));
  [...rows[2]].forEach((ch) => r3.appendChild(mkBtn(ch, "", () => handleKey(ch))));
  r3.appendChild(mkBtn("⌫", "wide", () => handleKey("⌫")));
  kb.appendChild(r3);
}

function updateKeyboardColors() {
  state.guesses.forEach((guess) => {
    const evaluation = evaluateGuess(guess);

    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i].toLowerCase();
      const status = evaluation[i];

      const priority = { g: 3, y: 2, b: 1 };
      const currentPriority = priority[state.keyboardState[letter]] || 0;
      const newPriority = priority[status];

      if (newPriority > currentPriority) state.keyboardState[letter] = status;
    }
  });

  Object.keys(state.keyboardState).forEach((letter) => {
    const key = document.querySelector(`[data-key="${letter}"]`);
    if (key) {
      key.classList.remove("g", "y", "b");
      key.classList.add(state.keyboardState[letter]);
    }
  });
}

// ===== INPUT =====
function handleKeyPress(e) {
  if (state.gameOver) return;

  if (e.key === "Enter") handleKey("ENTER");
  else if (e.key === "Backspace") handleKey("⌫");
  else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase());
}

function handleKey(key) {
  if (state.gameOver) return;

  if (key === "ENTER") submitGuess();
  else if (key === "⌫") {
    state.currentGuess = state.currentGuess.slice(0, -1);
    renderBoard();
  } else if (key.length === 1 && /^[A-Z]$/.test(key)) {
    if (state.currentGuess.length < state.length) {
      state.currentGuess += key;
      renderBoard();
    }
  }
}

function submitGuess() {
  if (state.currentGuess.length !== state.length) {
    toast(`Word must be ${state.length} letters`);
    return;
  }

  if (!isValidWord(state.currentGuess, state.length)) {
    toast("Not in word list");
    shakeRow(state.guesses.length);
    return;
  }

  state.guesses.push(state.currentGuess);
  state.currentGuess = "";

  renderBoard();
  updateKeyboardColors();
  updateGuessCounter();

  if (state.guesses[state.guesses.length - 1] === state.word) {
    state.won = true;
    state.gameOver = true;
    setTimeout(() => handleWin(), 1500);
  } else if (state.guesses.length >= 6) {
    state.gameOver = true;
    setTimeout(() => handleLose(), 1500);
  }
}

function shakeRow(rowIndex) {
  const row = $(`row-${rowIndex}`);
  row.style.animation = "shake 0.5s";
  setTimeout(() => (row.style.animation = ""), 500);
}

// ===== END =====
function handleWin() {
  const stats = loadStats();
  const guessCount = state.guesses.length;

  if (state.mode === "daily") {
    stats.daily.totalGames++;
    stats.daily.wins++;
    stats.daily.guessDistribution[guessCount - 1]++;

    const today = getTodayString();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    if (stats.daily.lastPlayed === yesterday) stats.daily.currentStreak++;
    else if (stats.daily.lastPlayed !== today) stats.daily.currentStreak = 1;

    stats.daily.maxStreak = Math.max(stats.daily.maxStreak, stats.daily.currentStreak);
    stats.daily.lastPlayed = today;
  } else {
    stats.endless.totalGames++;
    stats.endless.wins++;
    stats.endless.guessDistribution[guessCount - 1]++;
  }

  saveStats(stats);

  $("winTitle").textContent = state.mode === "daily" ? "Daily Challenge Complete!" : "You Won!";
  $("winGuesses").textContent = `${guessCount}/6`;
  $("winStreak").textContent = stats.daily.currentStreak;
  $("theWord").textContent = state.word;

  fetchDefinition(state.word, "definitionBox");
  $("winModal").hidden = false;
  toast("🎉 Congratulations! 🎉", 3000);
}

function handleLose() {
  const stats = loadStats();

  if (state.mode === "daily") {
    stats.daily.totalGames++;
    stats.daily.currentStreak = 0;
    stats.daily.lastPlayed = getTodayString();
  } else {
    stats.endless.totalGames++;
  }

  saveStats(stats);

  $("loseWord").textContent = state.word;
  fetchDefinition(state.word, "loseDefinitionBox");
  $("loseModal").hidden = false;
}

// ===== DEFINITION =====
async function fetchDefinition(word, containerId) {
  const container = $(containerId);
  container.innerHTML = '<div class="defLoading">Loading definition...</div>';

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
    if (!response.ok) throw new Error("Definition not found");

    const data = await response.json();
    const entry = data[0];

    let html = '<div class="defContent">';
    html += `<div class="defWord">${entry.word}</div>`;
    if (entry.phonetic) html += `<div class="defPronunciation">${entry.phonetic}</div>`;

    if (entry.meanings?.length) {
      const meaning = entry.meanings[0];
      html += '<div class="defMeaning">';
      html += `<span class="defPartOfSpeech">${meaning.partOfSpeech}</span>`;
      const def = meaning.definitions?.[0];
      if (def?.definition) {
        html += `<div class="defDefinition">${def.definition}</div>`;
        if (def.example) html += `<div class="defExample">"${def.example}"</div>`;
      }
      html += "</div>";
    }

    html += "</div>";
    container.innerHTML = html;
  } catch {
    container.innerHTML = `
      <div class="defContent">
        <div class="defDefinition">Definition not available for this word.</div>
      </div>
    `;
  }
}

// ===== STATS =====
function showStats() {
  const stats = loadStats();

  const totalGames =
    stats.daily.totalGames + stats.endless.totalGames + (stats.pvp?.totalGames || 0);
  const totalWins = stats.daily.wins + stats.endless.wins + (stats.pvp?.wins || 0);
  const winPercent = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  $("totalGamesStats").textContent = totalGames;
  $("winPercentStats").textContent = winPercent;
  $("currentStreakStats").textContent = stats.daily.currentStreak;
  $("maxStreakStats").textContent = stats.daily.maxStreak;

  const distContainer = $("guessDistribution");
  distContainer.innerHTML =
    '<h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 700;">Solo Mode Distribution</h3>';

  const combined = stats.daily.guessDistribution.map((v, i) => v + stats.endless.guessDistribution[i]);
  const maxGuesses = Math.max(...combined, 1);

  combined.forEach((count, i) => {
    const bar = document.createElement("div");
    bar.style.cssText = `display:flex;align-items:center;gap:8px;margin-bottom:8px;`;

    const label = document.createElement("div");
    label.textContent = i + 1;
    label.style.cssText = "width:20px;font-weight:700;color:var(--text-muted);";

    const barFill = document.createElement("div");
    const width = maxGuesses > 0 ? (count / maxGuesses) * 100 : 0;
    barFill.style.cssText = `
      flex:1;height:24px;background:var(--accent-primary);
      border-radius:4px;display:flex;align-items:center;justify-content:flex-end;
      padding:0 8px;font-weight:700;font-size:14px;width:${Math.max(width, 5)}%;
      min-width:24px;transition:width .3s ease;
    `;
    barFill.textContent = count;

    bar.appendChild(label);
    bar.appendChild(barFill);
    distContainer.appendChild(bar);
  });

  $("statsModal").hidden = false;
}

function resetStats() {
  if (confirm("Are you sure you want to reset all statistics? This cannot be undone.")) {
    saveStats(defaultStats);
    toast("Statistics reset");
    $("statsModal").hidden = true;
    updateStatsPreview(defaultStats);
  }
}

// ===== PLAY AGAIN =====
function playAgain() {
  $("winModal").hidden = true;
  $("loseModal").hidden = true;

  if (state.mode === "daily") {
    toast("Daily challenge complete! Try Endless Mode.", 3000);
    setTimeout(() => backToMenu(), 1000);
  } else {
    startEndlessMode(state.length);
  }
}

// ===== SHARE RESULTS =====
function shareResults() {
  const guessCount = state.won ? state.guesses.length : "X";
  let text = `Wordle ${state.mode === "daily" ? "Daily" : "Endless"} ${guessCount}/6\n\n`;

  state.guesses.forEach((guess) => {
    const evaluation = evaluateGuess(guess);
    text += evaluation.map((s) => (s === "g" ? "🟩" : s === "y" ? "🟨" : "⬛")).join("") + "\n";
  });

  navigator.clipboard.writeText(text).then(
    () => toast("Copied to clipboard!"),
    () => toast("Could not copy to clipboard"),
  );
}

// ========================================
// PUBLIC ROOMS & QUICK MATCH
// ========================================
async function handleQuickMatch() {
  const name = localStorage.getItem("playerName") || "Player";
  toast(t("lookingForMatch") || "Looking for a match...", 3000);

  try {
    const response = await fetch("/api/quickMatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    if (data.code) {
      toast(`${t(data.created ? "roomCreated" : "joinedRoom")} ${data.code}`, 2000);

      setTimeout(() => {
        const pid = data.playerId || data.pid || (data.created ? "host" : "guest");
        window.location.href = pvpUrl(data.code, pid, name);
      }, 1000);
    }
  } catch (error) {
    console.error("Quick match error:", error);
    toast(t("error") || "Failed to find match", 2000);
  }
}

function showPublicRoomsBrowser() {
  const modal = $("roomsBrowserModal");
  modal.hidden = false;
  loadPublicRooms();

  $("closeRoomsBtn").addEventListener("click", () => (modal.hidden = true));
  $("refreshRoomsBtn").addEventListener("click", () => loadPublicRooms());
  $("createPublicRoomBtn").addEventListener("click", () => {
    modal.hidden = true;
    window.location.href = "singleplayer.html?createPublic=true";
  });
}

async function loadPublicRooms() {
  const roomsList = $("roomsList");
  roomsList.innerHTML = `<div class="roomsLoading">${t("loading")}</div>`;

  try {
    const response = await fetch("/api/listPublicRooms");
    const data = await response.json();

    if (data.rooms?.length) {
      roomsList.innerHTML = data.rooms
        .map(
          (room) => `
        <div class="roomItem" onclick="joinPublicRoom('${room.code}')">
          <div class="roomInfo">
            <div class="roomName">${t("host")}: ${escapeHtml(room.hostName)}</div>
            <div class="roomDetails">
              <span class="roomBadge">${t("mode")}: ${
                room.mode === "random" ? t("randomWords") : t("customWords")
              }</span>
              <span>${t("timer")}: ${room.timerSeconds || 120}${t("seconds")}</span>
              <span>${room.wordLength || 5} ${t("letters")}</span>
            </div>
          </div>
          <button class="btn">${t("joinRoom")}</button>
        </div>
      `,
        )
        .join("");
    } else {
      roomsList.innerHTML = `
        <div class="noRoomsMessage">
          <h3>${t("noRooms")}</h3>
          <p>${t("noRoomsDesc")}</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Error loading public rooms:", error);
    roomsList.innerHTML = `<div class="roomsLoading">${t("error") || "Failed to load rooms"}</div>`;
  }
}

function joinPublicRoom(code) {
  const name = localStorage.getItem("playerName") || "Player";
  toast(`${t("joinedRoom")} ${code}`, 2000);

  setTimeout(() => {
    // ეს მიდის PVP გვერდზე
    window.location.href = pvpUrl(code, "guest", name);
  }, 1000);
}
window.joinPublicRoom = joinPublicRoom;

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Translation helper
function t(key) {
  if (typeof translations !== "undefined" && typeof getCurrentLanguage === "function") {
    const lang = getCurrentLanguage();
    return translations[lang]?.[key] || key;
  }
  return key;
}

// ===== INITIALIZATION (ერთხელ მხოლოდ) =====
function init() {
  initModeSelector();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// shake animation
const style = document.createElement("style");
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);
