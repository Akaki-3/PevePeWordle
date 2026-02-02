import { getDailyWord, getRandomWord, isValidWord } from "./wordlist.js";

const $ = (id) => document.getElementById(id);

// Game state
const state = {
  mode: null, // 'daily' or 'endless'
  word: "",
  length: 5,
  guesses: [],
  currentGuess: "",
  gameOver: false,
  won: false,
  keyboardState: {}, // Track letter states for keyboard coloring
};

// Stats structure
const defaultStats = {
  daily: {
    lastPlayed: null,
    currentStreak: 0,
    maxStreak: 0,
    totalGames: 0,
    wins: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0], // Indices 0-5 for guesses 1-6
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

// Load stats from localStorage
function loadStats() {
  const saved = localStorage.getItem("wordleStats");
  if (saved) {
    try {
      const stats = JSON.parse(saved);
      // Add pvp stats if not present (backwards compatibility)
      if (!stats.pvp) {
        stats.pvp = {
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          currentStreak: 0,
          maxStreak: 0,
        };
      }
      return stats;
    } catch (e) {
      return { ...defaultStats };
    }
  }
  return { ...defaultStats };
}

// Save stats to localStorage
function saveStats(stats) {
  localStorage.setItem("wordleStats", JSON.stringify(stats));
}

// Get today's date string
function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

// Toast notification
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
    window.location.href = "singleplayer.html";
  });
}

function updateStatsPreview(stats) {
  // Show daily streak
  $("streakValue").textContent = stats.daily.currentStreak;

  // Calculate combined win rate (daily + endless + pvp)
  const totalGames =
    stats.daily.totalGames +
    stats.endless.totalGames +
    (stats.pvp?.totalGames || 0);
  const totalWins =
    stats.daily.wins + stats.endless.wins + (stats.pvp?.wins || 0);
  const winRate =
    totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  $("winRateValue").textContent = `${winRate}%`;
  $("gamesValue").textContent = totalGames;
}

function startDailyMode() {
  const stats = loadStats();
  const today = getTodayString();

  // Check if already played today
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

  const buttons = document.querySelectorAll(".lengthBtn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const length = parseInt(btn.dataset.length);
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
  // Reset state
  state.guesses = [];
  state.currentGuess = "";
  state.gameOver = false;
  state.won = false;
  state.keyboardState = {};

  // Show game screen
  $("modeSelector").style.display = "none";
  $("gameScreen").style.display = "flex";

  // Update UI
  const stats = loadStats();
  $("gameMode").textContent =
    state.mode === "daily" ? "Daily Challenge" : "Endless Practice";
  $("wordLengthIndicator").textContent = `${state.length} letters`;
  $("currentStreak").textContent = stats.daily.currentStreak;
  updateGuessCounter();

  // Build board and keyboard
  buildBoard();
  buildKeyboard();

  // Event listeners
  setupEventListeners();
}

function setupEventListeners() {
  $("backBtn").addEventListener("click", () => backToMenu());
  $("statsBtn").addEventListener("click", () => showStats());
  $("closeStatsBtn").addEventListener(
    "click",
    () => ($("statsModal").hidden = true),
  );
  $("resetStatsBtn").addEventListener("click", () => resetStats());
  $("playAgainBtn").addEventListener("click", () => playAgain());
  $("losePlayAgainBtn").addEventListener("click", () => playAgain());
  $("shareBtn").addEventListener("click", () => shareResults());

  // Keyboard input
  document.addEventListener("keydown", handleKeyPress);
}

function backToMenu() {
  $("gameScreen").style.display = "none";
  $("modeSelector").style.display = "flex";
  document.removeEventListener("keydown", handleKeyPress);

  const stats = loadStats();
  updateStatsPreview(stats);
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
  // Render completed guesses
  for (let i = 0; i < state.guesses.length; i++) {
    const guess = state.guesses[i];
    const evaluation = evaluateGuess(guess);

    for (let j = 0; j < state.length; j++) {
      const cell = $(`cell-${i}-${j}`);
      cell.textContent = guess[j];
      cell.classList.add("filled", "revealed", evaluation[j]);

      // Add staggered animation delay
      cell.style.animationDelay = `${j * 0.1}s`;
    }
  }

  // Render current guess
  if (!state.gameOver && state.guesses.length < 6) {
    const currentRow = state.guesses.length;
    for (let j = 0; j < state.length; j++) {
      const cell = $(`cell-${currentRow}-${j}`);
      cell.textContent = state.currentGuess[j] || "";
      if (state.currentGuess[j]) {
        cell.classList.add("filled");
      } else {
        cell.classList.remove("filled");
      }
    }
  }
}

function evaluateGuess(guess) {
  const result = Array(state.length).fill("b");
  const wordArray = state.word.split("");
  const guessArray = guess.split("");
  const used = Array(state.length).fill(false);

  // First pass: mark correct letters (green)
  for (let i = 0; i < state.length; i++) {
    if (guessArray[i] === wordArray[i]) {
      result[i] = "g";
      used[i] = true;
      guessArray[i] = null;
    }
  }

  // Second pass: mark present letters (yellow)
  for (let i = 0; i < state.length; i++) {
    if (guessArray[i] === null) continue;

    const idx = wordArray.findIndex(
      (letter, j) => !used[j] && letter === guessArray[i],
    );

    if (idx !== -1) {
      result[i] = "y";
      used[idx] = true;
    }
  }

  return result;
}

// ===== KEYBOARD (PVP Style) =====
function buildKeyboard() {
  const kb = $("keyboard");
  // Ensure the container has the PVP 'kb' class so it picks up shared styles
  kb.classList.add("kb");
  kb.innerHTML = "";

  const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  const mkBtn = (label, cls, onClick) => {
    const b = document.createElement("button");
    // give buttons both the singleplayer 'key' class and the PVP 'kbBtn' class
    b.className = "key kbBtn " + (cls || "");
    // Add data-key for easier lookup when updating colors
    b.dataset.key = label.length === 1 ? label.toLowerCase() : label;
    b.textContent = label;
    b.addEventListener("click", onClick);
    return b;
  };

  const r1 = document.createElement("div");
  r1.className = "kbRow";
  r1.style.gridTemplateColumns = "repeat(10, 1fr)";
  [...rows[0]].forEach((ch) =>
    r1.appendChild(mkBtn(ch, "", () => handleKey(ch))),
  );
  kb.appendChild(r1);

  const r2 = document.createElement("div");
  r2.className = "kbRow mid";
  r2.style.gridTemplateColumns = "repeat(9, 1fr)";
  [...rows[1]].forEach((ch) =>
    r2.appendChild(mkBtn(ch, "", () => handleKey(ch))),
  );
  kb.appendChild(r2);

  const r3 = document.createElement("div");
  r3.className = "kbRow last";
  r3.style.gridTemplateColumns = "1.5fr repeat(7, 1fr) 1.5fr";
  r3.appendChild(mkBtn("ENTER", "wide", () => handleKey("ENTER")));
  [...rows[2]].forEach((ch) =>
    r3.appendChild(mkBtn(ch, "", () => handleKey(ch))),
  );
  r3.appendChild(mkBtn("⌫", "wide", () => handleKey("⌫")));
  kb.appendChild(r3);
}

function updateKeyboardColors() {
  // Update keyboard based on guessed letters
  state.guesses.forEach((guess) => {
    const evaluation = evaluateGuess(guess);

    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];
      const status = evaluation[i];

      // Only update if new status is "better" (g > y > b)
      const priority = { g: 3, y: 2, b: 1 };
      const currentPriority = priority[state.keyboardState[letter]] || 0;
      const newPriority = priority[status];

      if (newPriority > currentPriority) {
        state.keyboardState[letter] = status;
      }
    }
  });

  // Apply colors to keyboard buttons
  Object.keys(state.keyboardState).forEach((letter) => {
    const key = document.querySelector(`[data-key="${letter}"]`);
    if (key) {
      key.classList.remove("g", "y", "b");
      key.classList.add(state.keyboardState[letter]);
    }
  });
}

// ===== INPUT HANDLING =====
function handleKeyPress(e) {
  if (state.gameOver) return;

  if (e.key === "Enter") {
    handleKey("ENTER");
  } else if (e.key === "Backspace") {
    handleKey("⌫");
  } else if (/^[a-zA-Z]$/.test(e.key)) {
    handleKey(e.key.toUpperCase());
  }
}

function handleKey(key) {
  if (state.gameOver) return;

  if (key === "ENTER") {
    submitGuess();
  } else if (key === "⌫") {
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

  // Validate word exists in our word list
  if (!isValidWord(state.currentGuess, state.length)) {
    toast("Not in word list");
    shakeRow(state.guesses.length);
    return;
  }

  // Add guess
  state.guesses.push(state.currentGuess);
  state.currentGuess = "";

  renderBoard();
  updateKeyboardColors();
  updateGuessCounter();

  // Check win condition
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
  setTimeout(() => {
    row.style.animation = "";
  }, 500);
}

// ===== GAME END =====
function handleWin() {
  const stats = loadStats();
  const guessCount = state.guesses.length;

  // Update stats
  if (state.mode === "daily") {
    stats.daily.totalGames++;
    stats.daily.wins++;
    stats.daily.guessDistribution[guessCount - 1]++;

    const today = getTodayString();
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0];

    if (stats.daily.lastPlayed === yesterday) {
      stats.daily.currentStreak++;
    } else if (stats.daily.lastPlayed !== today) {
      stats.daily.currentStreak = 1;
    }

    stats.daily.maxStreak = Math.max(
      stats.daily.maxStreak,
      stats.daily.currentStreak,
    );
    stats.daily.lastPlayed = today;
  } else {
    stats.endless.totalGames++;
    stats.endless.wins++;
    stats.endless.guessDistribution[guessCount - 1]++;
  }

  saveStats(stats);

  // Show win modal
  $("winTitle").textContent =
    state.mode === "daily" ? "Daily Challenge Complete!" : "You Won!";
  $("winGuesses").textContent = `${guessCount}/6`;
  $("winStreak").textContent = stats.daily.currentStreak;
  $("theWord").textContent = state.word;

  // Fetch definition
  fetchDefinition(state.word, "definitionBox");

  $("winModal").hidden = false;

  // Confetti effect
  toast("🎉 Congratulations! 🎉", 3000);
}

function handleLose() {
  const stats = loadStats();

  // Update stats
  if (state.mode === "daily") {
    stats.daily.totalGames++;
    stats.daily.currentStreak = 0; // Reset streak

    const today = getTodayString();
    stats.daily.lastPlayed = today;
  } else {
    stats.endless.totalGames++;
  }

  saveStats(stats);

  // Show lose modal
  $("loseWord").textContent = state.word;

  // Fetch definition
  fetchDefinition(state.word, "loseDefinitionBox");

  $("loseModal").hidden = false;
}

// ===== DEFINITION API =====
async function fetchDefinition(word, containerId) {
  const container = $(containerId);
  container.innerHTML = '<div class="defLoading">Loading definition...</div>';

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`,
    );

    if (!response.ok) {
      throw new Error("Definition not found");
    }

    const data = await response.json();
    const entry = data[0];

    let html = '<div class="defContent">';
    html += `<div class="defWord">${entry.word}</div>`;

    if (entry.phonetic) {
      html += `<div class="defPronunciation">${entry.phonetic}</div>`;
    }

    // Get first meaning
    if (entry.meanings && entry.meanings.length > 0) {
      const meaning = entry.meanings[0];
      html += '<div class="defMeaning">';
      html += `<span class="defPartOfSpeech">${meaning.partOfSpeech}</span>`;

      if (meaning.definitions && meaning.definitions.length > 0) {
        const def = meaning.definitions[0];
        html += `<div class="defDefinition">${def.definition}</div>`;

        if (def.example) {
          html += `<div class="defExample">"${def.example}"</div>`;
        }
      }

      html += "</div>";
    }

    html += "</div>";
    container.innerHTML = html;
  } catch (error) {
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

  // Include PVP stats in totals
  const totalGames =
    stats.daily.totalGames +
    stats.endless.totalGames +
    (stats.pvp?.totalGames || 0);
  const totalWins =
    stats.daily.wins + stats.endless.wins + (stats.pvp?.wins || 0);
  const winPercent =
    totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  $("totalGamesStats").textContent = totalGames;
  $("winPercentStats").textContent = winPercent;
  $("currentStreakStats").textContent = stats.daily.currentStreak;
  $("maxStreakStats").textContent = stats.daily.maxStreak;

  // Guess distribution
  const distContainer = $("guessDistribution");
  distContainer.innerHTML =
    '<h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 700;">Solo Mode Distribution</h3>';

  const combined = stats.daily.guessDistribution.map(
    (v, i) => v + stats.endless.guessDistribution[i],
  );
  const maxGuesses = Math.max(...combined, 1);

  combined.forEach((count, i) => {
    const bar = document.createElement("div");
    bar.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    `;

    const label = document.createElement("div");
    label.textContent = i + 1;
    label.style.cssText =
      "width: 20px; font-weight: 700; color: var(--text-muted);";

    const barFill = document.createElement("div");
    const width = maxGuesses > 0 ? (count / maxGuesses) * 100 : 0;
    barFill.style.cssText = `
      flex: 1;
      height: 24px;
      background: var(--accent-primary);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 8px;
      font-weight: 700;
      font-size: 14px;
      width: ${Math.max(width, 5)}%;
      min-width: 24px;
      transition: width 0.3s ease;
    `;
    barFill.textContent = count;

    bar.appendChild(label);
    bar.appendChild(barFill);
    distContainer.appendChild(bar);
  });

  // Add PVP stats section
  if (stats.pvp && stats.pvp.totalGames > 0) {
    distContainer.innerHTML += `
      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border);">
        <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 700;">PVP Stats</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 12px;">
          <div style="text-align: center; padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 900; color: var(--accent-primary);">${stats.pvp.wins}</div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Wins</div>
          </div>
          <div style="text-align: center; padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 900; color: var(--accent-danger);">${stats.pvp.losses}</div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Losses</div>
          </div>
          <div style="text-align: center; padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 900; color: var(--accent-warning);">${stats.pvp.draws}</div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Draws</div>
          </div>
          <div style="text-align: center; padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
            <div style="font-size: 24px; font-weight: 900; color: var(--accent-secondary);">${stats.pvp.currentStreak}</div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 600;">Current Streak</div>
          </div>
        </div>
        <div style="font-size: 14px; color: var(--text-muted); text-align: center;">
          Max Streak: <span style="color: var(--accent-primary); font-weight: 900;">${stats.pvp.maxStreak}</span>
        </div>
      </div>
    `;
  }

  $("statsModal").hidden = false;
}

function resetStats() {
  if (
    confirm(
      "Are you sure you want to reset all statistics? This cannot be undone.",
    )
  ) {
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
    // Can't play daily again same day
    toast("Daily challenge complete! Try Endless Mode.", 3000);
    setTimeout(() => backToMenu(), 1000);
  } else {
    // Start new endless game with same length
    startEndlessMode(state.length);
  }
}

// ===== SHARE RESULTS =====
function shareResults() {
  const guessCount = state.won ? state.guesses.length : "X";
  let text = `Wordle ${state.mode === "daily" ? "Daily" : "Endless"} ${guessCount}/6\n\n`;

  state.guesses.forEach((guess) => {
    const evaluation = evaluateGuess(guess);
    const line = evaluation
      .map((status) => {
        if (status === "g") return "🟩";
        if (status === "y") return "🟨";
        return "⬛";
      })
      .join("");
    text += line + "\n";
  });

  // Copy to clipboard
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast("Copied to clipboard!");
    })
    .catch(() => {
      toast("Could not copy to clipboard");
    });
}

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  initModeSelector();
});

// Add shake animation to CSS dynamically
const style = document.createElement("style");
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);
