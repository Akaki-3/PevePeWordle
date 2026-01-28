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

// normalize: keep letters only, lowercased
export function normalizeWord(w) {
  return String(w || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

export function isValidWordLen(w, min = 5, max = 20) {
  return typeof w === "string" && w.length >= min && w.length <= max && /^[a-z]+$/.test(w);
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

// Wordle evaluation for any length N: returns array of "g","y","b"
export function evaluateGuess(secret, guess) {
  const N = secret.length;
  const s = secret.split("");
  const g = guess.split("");

  const result = Array(N).fill("b");
  const used = Array(N).fill(false);

  // greens
  for (let i = 0; i < N; i++) {
    if (g[i] === s[i]) {
      result[i] = "g";
      used[i] = true;
      g[i] = null;
    }
  }

  // yellows
  for (let i = 0; i < N; i++) {
    if (g[i] == null) continue;
    const idx = s.findIndex((c, j) => !used[j] && c === g[i]);
    if (idx !== -1) {
      result[i] = "y";
      used[idx] = true;
    }
  }

  return result;
}
