import { redis, json, roomKey } from "./_redis.js";

const WORDS = [
  "about","other","which","their","there","apple","spice","crane","stone","light",
  "smile","fresh","brick","chair","crown","trust","tears","laugh","power","dance",
  "zesty","sugar","green","black","white","flame","glory","heart","dream","storm"
];

function pick() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  const body = await readJson(req);
  const code = String(body?.code || "").trim().toUpperCase();
  const playerId = String(body?.playerId || "");

  const key = roomKey(code);
  const room = await redis.get(key);
  if (!room) return json(res, 404, { error: "Room not found" });
  if (playerId !== "host") return json(res, 403, { error: "Only host can start" });
  if (!room.players.guest) return json(res, 409, { error: "Need a guest to start" });
  if (room.status !== "lobby") return json(res, 409, { error: "Already started" });

  if (!room.players.host.ready || !room.players.guest.ready) {
    return json(res, 409, { error: "Both players must be ready" });
  }

  if (room.mode === "custom") {
    if (!room.players.host.secretForOpponent || !room.players.guest.secretForOpponent) {
      return json(res, 409, { error: "Both must set a 5-letter word" });
    }
    room.random.guestSecret = room.players.host.secretForOpponent; // guest solves
    room.random.hostSecret = room.players.guest.secretForOpponent; // host solves
  } else {
    room.random.hostSecret = pick();
    room.random.guestSecret = pick();
  }

  room.status = "running";
  room.startAt = Date.now();

  room.players.host.guesses = [];
  room.players.host.results = [];
  room.players.host.score = 0;
  room.players.host.finishedAt = null;

  room.players.guest.guesses = [];
  room.players.guest.results = [];
  room.players.guest.score = 0;
  room.players.guest.finishedAt = null;

  room.lastUpdate = Date.now();
  await redis.set(key, room, { ex: 60 * 60 });
  return json(res, 200, { ok: true });
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { return {}; }
}
