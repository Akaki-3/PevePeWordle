import { getDailyWord, getRandomWord, isValidWord } from "./wordlist.js";

const $ = (id) => document.getElementById(id);

function pvpUrl(code, pid, name) {
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
  console.log("initModeSelector called!");
  const stats = loadStats();
  updateStatsPreview(stats);

  $("dailyModeBtn").addEventListener("click", () => startDailyMode());
  $("endlessModeBtn").addEventListener("click", () => showLengthSelector());
  $("pvpModeBtn").addEventListener("click", () => {
    window.location.href = "singleplayer.html";
  });

  const quickMatchBtn = $("quickMatchBtn");
  console.log("Quick Match button element:", quickMatchBtn);
  if (quickMatchBtn) {
    quickMatchBtn.addEventListener("click", handleQuickMatch);
    console.log("Quick Match click listener attached!");
  } else {
    console.error("Quick Match button not found!");
  }

  const browseRoomsBtn = $("browseRoomsBtn");
  console.log("Browse Rooms button element:", browseRoomsBtn);
  if (browseRoomsBtn) {
    browseRoomsBtn.addEventListener("click", showPublicRoomsBrowser);
    console.log("Browse Rooms click listener attached!");
  } else {
    console.error("Browse Rooms button not found!");
  }
}

function updateStatsPreview(stats) {
  $("streakValue").textContent = stats.daily.currentStreak;

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

async function startDailyMode() {
  const stats = loadStats();
  const today = getTodayString();

  if (stats.daily.lastPlayed === today) {
    toast("You already played today! Try Endless Mode.", 3000);
    return;
  }

  state.mode = "daily";
  const dailyData = await getDailyWord();
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

async function startEndlessMode(length) {
  state.mode = "endless";
  state.word = await getRandomWord(length);
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
  $("gameMode").textContent =
    state.mode === "daily" ? "Daily Challenge" : "Endless Practice";
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
function getKeyboardRows() {
  const lang = getCurrentLanguage();
  if (lang === "ka") {
    return ["ქწერტყუიოპ", "ასდფგჰჯკლ", "ზხცვბნმხ"];
  }
  return ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
}

function buildKeyboard() {
  const kb = $("keyboard");
  kb.classList.add("kb");
  kb.innerHTML = "";

  const rows = getKeyboardRows();

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

      if (newPriority > currentPriority) {
        state.keyboardState[letter] = status;
      }
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

// ===== INPUT HANDLING =====
function isGeorgianKey(key) {
  const georgianChars = 'აბგდევზთიკლმნოპრსტუფქღყშჩცძწხ';
  return georgianChars.includes(key.toLowerCase());
}

function handleKeyPress(e) {
  if (state.gameOver) return;

  if (e.key === "Enter") handleKey("ENTER");
  else if (e.key === "Backspace" || e.key === "Delete") handleKey("⌫");
  else if (/^[a-zA-Z]$/.test(e.key)) {
    // English
    handleKey(e.key.toUpperCase());
  } else if (isGeorgianKey(e.key)) {
    // Georgian
    handleKey(e.key);
  }
}

function isValidLetter(key, lang) {
  if (lang === 'ka') {
    const georgianChars = 'აბგდევზთიკლმნოპრსტუფქღყშჩცძწხ';
    return georgianChars.includes(key);
  }
  return /^[A-Z]$/.test(key);
}

function handleKey(key) {
  if (state.gameOver) return;

  const lang = getCurrentLanguage();
  
  if (key === "ENTER") submitGuess();
  else if (key === "⌫") {
    state.currentGuess = state.currentGuess.slice(0, -1);
    renderBoard();
  } else if (key.length === 1 && isValidLetter(key, lang)) {
    if (state.currentGuess.length < state.length) {
      state.currentGuess += key;
      renderBoard();
    }
  }
}

async function validateWordWithAPI(word, lang) {
  // Check local cache first
  try {
    const cache = JSON.parse(localStorage.getItem('validatedWords') || '{}');
    const key = `${lang}_${word.toLowerCase()}`;
    if (cache[key]) return cache[key];
  } catch {}
  
  // If 404, use local validation
  try {
    const res = await fetch(`/api/validate-word?word=${encodeURIComponent(word)}&lang=${lang}`);
    if (res.status === 404) {
      // API not available - use local validation
      return await isValidWord(word, word.length);
    }
    const data = await res.json();
    
    // Cache result
    try {
      const cache = JSON.parse(localStorage.getItem('validatedWords') || '{}');
      const key = `${lang}_${word.toLowerCase()}`;
      cache[key] = data.valid;
      localStorage.setItem('validatedWords', JSON.stringify(cache));
    } catch {}
    
    return data.valid;
  } catch {
    // Fallback to local validation if API fails
    return await isValidWord(word, word.length);
  }
}

async function submitGuess() {
  if (state.currentGuess.length !== state.length) {
    toast(`Word must be ${state.length} letters`);
    return;
  }

  // Validate using API
  const lang = getCurrentLanguage();
  const isValid = await validateWordWithAPI(state.currentGuess, lang);
  
  if (!isValid) {
    const notInListMsg = t('notInWordList') || "Not in word list";
    toast(notInListMsg);
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
  setTimeout(() => {
    row.style.animation = "";
  }, 500);
}

// ===== GAME END =====
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

// ===== DEFINITION API =====
function getCachedDefinition(word, lang) {
  try {
    const cache = JSON.parse(localStorage.getItem('definitionCache') || '{}');
    const key = `${lang}_${word.toLowerCase()}`;
    return cache[key] || null;
  } catch { return null; }
}

function setCachedDefinition(word, lang, data) {
  try {
    const cache = JSON.parse(localStorage.getItem('definitionCache') || '{}');
    const key = `${lang}_${word.toLowerCase()}`;
    cache[key] = data;
    // Keep only last 100 cached definitions
    const keys = Object.keys(cache);
    if (keys.length > 100) {
      keys.slice(0, keys.length - 100).forEach(k => delete cache[k]);
    }
    localStorage.setItem('definitionCache', JSON.stringify(cache));
  } catch {}
}

// Local definition fallback for Georgian words - IN GEORGIAN
const LOCAL_DEFINITIONS = {
  ka: {
    "სახლი": { definition: "საცხოვრებელი შენობა, სადაც ადამიანები ცხოვრობენ", partOfSpeech: "არსებითი სახელი" },
    "წყალი": { definition: "გამჭვირვალე, უფერო სითხე, სიცოცხლისთვის აუცილებელი", partOfSpeech: "არსებითი სახელი" },
    "თვალი": { definition: "მხედველობის ორგანო, სახის ნაწილი", partOfSpeech: "არსებითი სახელი" },
    "წიგნი": { definition: "ბეჭდური ან ხელნაწერი გვერდების კრებული", partOfSpeech: "არსებითი სახელი" },
    "სკოლა": { definition: "სასწავლებელი, სადაც ბავშვები განათლებას იღებენ", partOfSpeech: "არსებითი სახელი" },
    "კვირა": { definition: "შვიდი დღის პერიოდი; ასევე კვირის ბოლო დღე", partOfSpeech: "არსებითი სახელი" },
    "თოვლი": { definition: "თეთრი, ბამბის მსგავსი ნალექი, ზამთარში ჩამოყრილი", partOfSpeech: "არსებითი სახელი" },
    "წვიმა": { definition: "ღრუბლებიდან ჩამოვარდნილი წყლის წვეთები", partOfSpeech: "არსებითი სახელი" },
    "ყველი": { definition: "რძისგან დამზადებული საკვები პროდუქტი", partOfSpeech: "არსებითი სახელი" },
    "ფიქრი": { definition: "გონებრივი მოქმედება, ფიქრი და მსჯელობა", partOfSpeech: "არსებითი სახელი" },
    "ოჯახი": { definition: "ერთად მცხოვრები ახლობელი ადამიანების ჯგუფი", partOfSpeech: "არსებითი სახელი" },
    "ექიმი": { definition: "მედიცინის სპეციალისტი, ავადმყოფებს მკურნალობს", partOfSpeech: "არსებითი სახელი" },
    "ტაქსი": { definition: "ქირაობის ავტომობილი, მძღოლით", partOfSpeech: "არსებითი სახელი" },
    "პარკი": { definition: "ხეებით, სკამებით მოწყობილი საჯარო სივრცე", partOfSpeech: "არსებითი სახელი" },
    "ბებია": { definition: "მამის ან დედის დედა", partOfSpeech: "არსებითი სახელი" },
    "ბაბუა": { definition: "მამის ან დედის მამა", partOfSpeech: "არსებითი სახელი" },
    "მეტრო": { definition: "მიწისქვეშა ელექტრული მატარებელი ქალაქში", partOfSpeech: "არსებითი სახელი" },
    "ქიმია": { definition: "მეცნიერება ნივთიერებათა შემადგენლობისა და გარდაქმნების შესახებ", partOfSpeech: "არსებითი სახელი" },
    "ვაშლი": { definition: "მრგვალი, წითელი ან მწვანე ხილი", partOfSpeech: "არსებითი სახელი" },
    "ღვინო": { definition: "ყურძნის წვენისგან დამზადებული ალკოჰოლური სასმელი", partOfSpeech: "არსებითი სახელი" },
    "ცხენი": { definition: "ოთხფეხა ცხოველი, ადამიანი სვამს ზევით", partOfSpeech: "არსებითი სახელი" },
    "ძაღლი": { definition: "შინაური ოთხფეხა ცხოველი, კაცის მეგობარი", partOfSpeech: "არსებითი სახელი" },
    "ქვიშა": { definition: "მოყვითალო, წვრილი მინერალური ნარჩენები, სანაპიროზე გხვდება", partOfSpeech: "არსებითი სახელი" },
    "სველი": { definition: "წყლით ან სხვა სითხით გაჟღენთილი", partOfSpeech: "ზედსართავი სახელი" },
  },
  en: {
    "house": { definition: "a building for human habitation", partOfSpeech: "noun" },
    "water": { definition: "a clear liquid essential for life", partOfSpeech: "noun" },
    "world": { definition: "the earth and all its inhabitants", partOfSpeech: "noun" },
    "apple": { definition: "a round fruit with red or green skin", partOfSpeech: "noun" },
    "bread": { definition: "food made from flour and water", partOfSpeech: "noun" }
  }
};

async function fetchDefinition(word, containerId) {
  const container = $(containerId);
  const loadingText = t('loadingDefinition') || 'Loading definition...';
  container.innerHTML = `<div class="defLoading">${loadingText}</div>`;

  const currentLang = getCurrentLanguage();
  
  // Check local cache first
  const cached = getCachedDefinition(word, currentLang);
  if (cached) {
    renderDefinition(container, cached);
    return;
  }

  // Check local definitions
  const localDef = LOCAL_DEFINITIONS[currentLang]?.[word];
  if (localDef) {
    const data = { word: word, ...localDef, source: 'Local' };
    setCachedDefinition(word, currentLang, data);
    renderDefinition(container, data);
    return;
  }

  // Try backend API first
  try {
    const response = await fetch(`/api/definitions?word=${encodeURIComponent(word)}&lang=${currentLang}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setCachedDefinition(word, currentLang, data);
        renderDefinition(container, data);
        return;
      }
    }
  } catch (_) {
    // Backend not available — fall through to free dictionary API
  }

  // For English words: try Free Dictionary API (no key required, works client-side)
  if (currentLang === 'en') {
    try {
      const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`);
      if (dictRes.ok) {
        const dictData = await dictRes.json();
        const entry = Array.isArray(dictData) && dictData[0];
        if (entry) {
          const meaning = entry.meanings?.[0];
          const defObj = meaning?.definitions?.[0];
          const data = {
            word: entry.word || word,
            phonetic: entry.phonetic || entry.phonetics?.find(p => p.text)?.text || null,
            partOfSpeech: meaning?.partOfSpeech || 'noun',
            definition: defObj?.definition || null,
            example: defObj?.example || null,
            source: 'Dictionary'
          };
          setCachedDefinition(word, currentLang, data);
          renderDefinition(container, data);
          return;
        }
      }
    } catch (_) {
      // Dictionary API unavailable — fall through to Georgian Wiktionary / final fallback
    }
  }

  // For Georgian words: try Wiktionary client-side
  if (currentLang === 'ka') {
    try {
      const wikiUrl = `https://ka.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(word)}&prop=extracts&exintro=true&exsentences=2&explaintext=true&format=json&origin=*`;
      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        const pages = wikiData?.query?.pages || {};
        const pageId = Object.keys(pages)[0];
        if (pageId && pageId !== '-1') {
          const extract = pages[pageId].extract || '';
          const sentences = extract.split(/[.!?]/).filter(s => s.trim());
          const data = {
            word: word,
            definition: sentences[0]?.trim() || extract.substring(0, 200),
            partOfSpeech: 'სახელი',
            example: sentences[1]?.trim() || null,
            source: 'Wiktionary'
          };
          setCachedDefinition(word, currentLang, data);
          renderDefinition(container, data);
          return;
        }
      }
    } catch (_) {
      // Wiktionary unavailable
    }
  }

  // Final fallback — generic message
  const fallbackData = {
    word: word,
    definition: currentLang === 'ka'
      ? `ქართული სიტყვა - ${word.length} ასო`
      : `No definition found for this word.`,
    partOfSpeech: currentLang === 'ka' ? 'სახელი' : 'noun',
    source: 'Fallback'
  };
  renderDefinition(container, fallbackData);
}

function renderDefinition(container, data) {
  let html = '<div class="defContent">';
  html += `<div class="defWord">${data.word}</div>`;
  
  if (data.phonetic) {
    html += `<div class="defPronunciation">${data.phonetic}</div>`;
  }

  if (data.definition) {
    html += '<div class="defMeaning">';
    if (data.partOfSpeech) {
      html += `<span class="defPartOfSpeech">${data.partOfSpeech}</span>`;
    }
    html += `<div class="defDefinition">${data.definition}</div>`;
    if (data.example) {
      html += `<div class="defExample">"${data.example}"</div>`;
    }
    html += "</div>";
  }

  html += '</div>';
  container.innerHTML = html;
}

// ===== STATS =====
function showStats() {
  const stats = loadStats();

  const totalGames =
    stats.daily.totalGames +
    stats.endless.totalGames +
    (stats.pvp?.totalGames || 0);
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
      padding:0 8px;font-weight:700;font-size:14px;
      width:${Math.max(width, 5)}%;min-width:24px;transition:width .3s ease;
    `;
    barFill.textContent = count;

    bar.appendChild(label);
    bar.appendChild(barFill);
    distContainer.appendChild(bar);
  });

  if (stats.pvp && stats.pvp.totalGames > 0) {
    distContainer.innerHTML += `
      <div style="margin-top:24px;padding-top:24px;border-top:1px solid var(--border);">
        <h3 style="margin-bottom:16px;font-size:18px;font-weight:700;">PVP Stats</h3>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:12px;">
          <div style="text-align:center;padding:12px;background:rgba(255,255,255,.05);border-radius:8px;">
            <div style="font-size:24px;font-weight:900;color:var(--accent-primary);">${stats.pvp.wins}</div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:600;">Wins</div>
          </div>
          <div style="text-align:center;padding:12px;background:rgba(255,255,255,.05);border-radius:8px;">
            <div style="font-size:24px;font-weight:900;color:var(--accent-danger);">${stats.pvp.losses}</div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:600;">Losses</div>
          </div>
          <div style="text-align:center;padding:12px;background:rgba(255,255,255,.05);border-radius:8px;">
            <div style="font-size:24px;font-weight:900;color:var(--accent-warning);">${stats.pvp.draws}</div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:600;">Draws</div>
          </div>
          <div style="text-align:center;padding:12px;background:rgba(255,255,255,.05);border-radius:8px;">
            <div style="font-size:24px;font-weight:900;color:var(--accent-secondary);">${stats.pvp.currentStreak}</div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:600;">Current Streak</div>
          </div>
        </div>
        <div style="font-size:14px;color:var(--text-muted);text-align:center;">
          Max Streak: <span style="color:var(--accent-primary);font-weight:900;">${stats.pvp.maxStreak}</span>
        </div>
      </div>
    `;
  }

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

function shareResults() {
  const guessCount = state.won ? state.guesses.length : "X";
  let text = `Wordle ${state.mode === "daily" ? "Daily" : "Endless"} ${guessCount}/6\n\n`;

  state.guesses.forEach((guess) => {
    const evaluation = evaluateGuess(guess);
    const line = evaluation
      .map((status) => (status === "g" ? "🟩" : status === "y" ? "🟨" : "⬛"))
      .join("");
    text += line + "\n";
  });

  navigator.clipboard.writeText(text).then(
    () => toast("Copied to clipboard!"),
    () => toast("Could not copy to clipboard"),
  );
}

// ===== AUTH INTEGRATION =====

function renderAvatar(el, user) {
  if (!el || !user) return;
  const [c1, c2] = [user.avatarColor1 || '#10b981', user.avatarColor2 || '#059669'];
  el.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
  el.textContent = Auth.getInitials(user.name);
}

function showProfilePill(user) {
  const pill = $('profilePill');
  if (!pill) return;
  pill.style.display = 'flex';
  renderAvatar($('profileAvatar'), user);
  $('profileName').textContent = user.name;
  $('profileBadge').textContent = user.isGuest
    ? (t('guest') || 'Guest')
    : (t('registeredUser') || 'Member');
}

function initAuthScreen() {
  const authScreen = $('authScreen');
  const modeSelector = $('modeSelector');
  if (!authScreen) return;

  const user = Auth.currentUser();
  if (user) {
    authScreen.style.display = 'none';
    modeSelector.style.display = '';
    showProfilePill(user);
    updateUserMenu(user);
    return;
  }

  authScreen.style.display = 'flex';
  modeSelector.style.display = 'none';

  // Tabs
  $('tabLogin').addEventListener('click', () => {
    $('tabLogin').classList.add('active');
    $('tabRegister').classList.remove('active');
    $('panelLogin').style.display = '';
    $('panelRegister').style.display = 'none';
  });
  $('tabRegister').addEventListener('click', () => {
    $('tabRegister').classList.add('active');
    $('tabLogin').classList.remove('active');
    $('panelRegister').style.display = '';
    $('panelLogin').style.display = 'none';
  });

  // Eye toggles
  $('loginEye').addEventListener('click', () => {
    const inp = $('loginPassword');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });
  $('regEye').addEventListener('click', () => {
    const inp = $('regPassword');
    inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  // Login
  $('loginBtn').addEventListener('click', async () => {
    $('loginError').textContent = '';
    $('loginBtn').disabled = true;
    const result = await Auth.login({
      email: $('loginEmail').value,
      password: $('loginPassword').value,
    });
    $('loginBtn').disabled = false;
    if (!result.ok) { $('loginError').textContent = result.error; return; }
    onAuthSuccess(result.user);
  });

  // Register - step 1: send verification code
  $('registerBtn').addEventListener('click', async () => {
    $('regError').textContent = '';
    $('registerBtn').disabled = true;
    const result = await Auth.registerStart({
      name: $('regName').value,
      email: $('regEmail').value,
      password: $('regPassword').value,
    });
    $('registerBtn').disabled = false;
    if (!result.ok) { $('regError').textContent = result.error; return; }

    // Show verification panel - code was sent to email only
    $('panelRegister').style.display = 'none';
    $('panelVerify').style.display = '';
    $('verifyEmailHint').textContent = `კოდი გამოგზავნილია: ${$('regEmail').value}`;
  });

  // Register - step 2: verify code
  $('verifyBtn').addEventListener('click', async () => {
    $('verifyError').textContent = '';
    $('verifyBtn').disabled = true;
    const code = $('verifyCodeInput').value.trim();
    const result = await Auth.registerVerify(code);
    $('verifyBtn').disabled = false;
    if (!result.ok) { $('verifyError').textContent = result.error; return; }
    onAuthSuccess(result.user);
  });

  // Back from verify to register
  $('backToRegisterBtn').addEventListener('click', () => {
    $('panelVerify').style.display = 'none';
    $('panelRegister').style.display = '';
    $('verifyError').textContent = '';
    $('verifyCodeInput').value = '';
  });

  // Guest
  $('guestBtn').addEventListener('click', () => {
    const result = Auth.loginAsGuest($('guestName').value);
    onAuthSuccess(result.user);
  });

  // Enter key
  [$('loginEmail'), $('loginPassword')].forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') $('loginBtn').click(); });
  });
  [$('regName'), $('regEmail'), $('regPassword')].forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') $('registerBtn').click(); });
  });
  $('verifyCodeInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('verifyBtn').click(); });
}

function onAuthSuccess(user) {
  $('authScreen').style.display = 'none';
  $('modeSelector').style.display = '';
  showProfilePill(user);
  updateStatsPreview(loadStats());
  updateUserMenu(user);
}

function initProfileControls() {
  const menuBtn = $('profileMenuBtn');
  const dropdown = $('profileDropdown');

  // Profile pill dropdown (registered users)
  if (menuBtn && dropdown) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = dropdown.style.display === 'block';
      dropdown.style.display = open ? 'none' : 'block';
    });
    document.addEventListener('click', () => { if (dropdown) dropdown.style.display = 'none'; });
  }

  // Shared logout function (works for both guest and registered)
  function doLogout() {
    Auth.logout();
    // Hide everything
    if (dropdown) dropdown.style.display = 'none';
    const userDD = $('userDropdown');
    if (userDD) userDD.style.display = 'none';
    const pill = $('profilePill');
    if (pill) pill.style.display = 'none';
    $('modeSelector').style.display = 'none';
    // Reset auth screen to login tab
    $('authScreen').style.display = 'flex';
    $('tabLogin').classList.add('active');
    $('tabRegister').classList.remove('active');
    $('panelLogin').style.display = '';
    $('panelRegister').style.display = 'none';
    $('panelVerify').style.display = 'none';
    // Reset user dropdown state
    const userMenuGuest = $('userMenuGuest');
    const userMenuLogged = $('userMenuLogged');
    if (userMenuGuest) userMenuGuest.style.display = '';
    if (userMenuLogged) userMenuLogged.style.display = 'none';
  }

  // Profile pill logout button
  const logoutBtn = $('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', doLogout);

  // User button dropdown (top of mode selector)
  const userBtn = $('userBtn');
  const userDropdown = $('userDropdown');
  if (userBtn && userDropdown) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = userDropdown.style.display === 'block';
      userDropdown.style.display = open ? 'none' : 'block';
    });
    document.addEventListener('click', () => { if (userDropdown) userDropdown.style.display = 'none'; });

    // Menu items
    const menuLoginBtn = $('menuLoginBtn');
    const menuRegisterBtn = $('menuRegisterBtn');
    const menuGuestBtn = $('menuGuestBtn');
    const menuLogoutBtn = $('menuLogoutBtn');
    const menuEditProfileBtn = $('menuEditProfileBtn');

    if (menuLoginBtn) menuLoginBtn.addEventListener('click', () => {
      userDropdown.style.display = 'none';
      $('modeSelector').style.display = 'none';
      $('authScreen').style.display = 'flex';
      $('tabLogin').classList.add('active');
      $('tabRegister').classList.remove('active');
      $('panelLogin').style.display = '';
      $('panelRegister').style.display = 'none';
      $('panelVerify').style.display = 'none';
    });

    if (menuRegisterBtn) menuRegisterBtn.addEventListener('click', () => {
      userDropdown.style.display = 'none';
      $('modeSelector').style.display = 'none';
      $('authScreen').style.display = 'flex';
      $('tabRegister').classList.add('active');
      $('tabLogin').classList.remove('active');
      $('panelRegister').style.display = '';
      $('panelLogin').style.display = 'none';
      $('panelVerify').style.display = 'none';
    });

    if (menuGuestBtn) menuGuestBtn.addEventListener('click', () => {
      userDropdown.style.display = 'none';
      const result = Auth.loginAsGuest('');
      onAuthSuccess(result.user);
      updateUserMenu(result.user);
    });

    if (menuLogoutBtn) menuLogoutBtn.addEventListener('click', doLogout);

    if (menuEditProfileBtn) menuEditProfileBtn.addEventListener('click', () => {
      userDropdown.style.display = 'none';
      openEditProfile();
    });
  }

  const editProfileBtn = $('editProfileBtn');
  if (editProfileBtn) editProfileBtn.addEventListener('click', () => {
    if (dropdown) dropdown.style.display = 'none';
    openEditProfile();
  });
}

// Update user dropdown UI based on current session
function updateUserMenu(user) {
  const userMenuGuest = $('userMenuGuest');
  const userMenuLogged = $('userMenuLogged');
  const menuAvatar = $('menuAvatar');
  const menuUserName = $('menuUserName');
  const menuUserStatus = $('menuUserStatus');

  if (!userMenuGuest || !userMenuLogged) return;

  if (user) {
    userMenuGuest.style.display = 'none';
    userMenuLogged.style.display = '';
    if (menuAvatar) renderAvatar(menuAvatar, user);
    if (menuUserName) menuUserName.textContent = user.name;
    if (menuUserStatus) menuUserStatus.textContent = user.isGuest ? '👤 სტუმარი' : '✓ Member';
  } else {
    userMenuGuest.style.display = '';
    userMenuLogged.style.display = 'none';
  }
}

function openEditProfile() {
  const user = Auth.currentUser();
  if (!user) return;
  const modal = $('editProfileModal');
  $('editName').value = user.name;
  $('editProfileError').textContent = '';
  renderAvatar($('editProfileAvatar'), user);
  modal.hidden = false;

  $('editName').addEventListener('input', () => {
    const preview = $('editProfileAvatar');
    const fakeName = $('editName').value || user.name;
    const [c1, c2] = Auth.avatarColors(fakeName);
    preview.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
    preview.textContent = Auth.getInitials(fakeName);
  });

  $('closeEditProfileBtn').onclick = () => { modal.hidden = true; };
  $('saveProfileBtn').onclick = async () => {
    $('editProfileError').textContent = '';
    $('saveProfileBtn').disabled = true;
    const result = await Auth.updateProfile({ name: $('editName').value });
    $('saveProfileBtn').disabled = false;
    if (!result.ok) { $('editProfileError').textContent = result.error; return; }
    showProfilePill(result.user);
    modal.hidden = true;
    toast('Profile updated!');
  };
}

// ===== INITIALIZATION =====
function init() {
  initAuthScreen();
  initProfileControls();
  initModeSelector();
  
  // Listen for language changes to rebuild keyboard
  window.addEventListener('languageChanged', () => {
    if (state.mode) {
      buildKeyboard();
    }
  });
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

// ========================================
// PUBLIC ROOMS & QUICK MATCH FUNCTIONALITY
// ========================================
async function handleQuickMatch() {
  console.log("Quick Match button clicked!");
  const user = Auth.currentUser();
  const name = (user && user.name) || localStorage.getItem("playerName") || "Player";
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
  console.log("Browse Rooms button clicked!");
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

    if (data.rooms && data.rooms.length > 0) {
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
    window.location.href = `singleplayer.html?room=${code}&name=${encodeURIComponent(name)}`;
  }, 1000);
}

window.joinPublicRoom = joinPublicRoom;

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function t(key) {
  if (typeof translations !== "undefined" && typeof getCurrentLanguage === "function") {
    const lang = getCurrentLanguage();
    return translations[lang]?.[key] || key;
  }
  return key;
}