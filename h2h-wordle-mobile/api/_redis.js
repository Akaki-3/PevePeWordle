import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

export function json(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export function normalizeWord(w) {
  return String(w || "").trim().toLowerCase();
}

export function isValidWord(w) {
  return /^[a-z]{5}$/.test(w);
}

export function roomKey(code) {
  return `room:${code}`;
}

export function makeCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Wordle evaluation: returns array of "g" (green), "y" (yellow), "b" (black)
export function evaluateGuess(secret, guess) {
  secret = secret.split("");
  guess = guess.split("");

  const result = Array(5).fill("b");
  const used = Array(5).fill(false);

  // Greens
  for (let i = 0; i < 5; i++) {
    if (guess[i] === secret[i]) {
      result[i] = "g";
      used[i] = true;
      guess[i] = null;
    }
  }

  // Yellows
  for (let i = 0; i < 5; i++) {
    if (guess[i] == null) continue;
    const idx = secret.findIndex((c, j) => !used[j] && c === guess[i]);
    if (idx !== -1) {
      result[i] = "y";
      used[idx] = true;
    }
  }

  return result;
}
