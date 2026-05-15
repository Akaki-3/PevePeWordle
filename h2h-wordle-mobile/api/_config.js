import { redis, json, roomKey, publicRoom } from "./_redis.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  const body = await readJson(req);
  const code = String(body?.code || "").trim().toUpperCase();
  const playerId = String(body?.playerId || "");
  const mode = String(body?.mode || "random");
  const timerSeconds = Math.max(30, Math.min(600, Number(body?.timerSeconds || 120)));

  if (playerId !== "host") return json(res, 403, { error: "Only host can change settings" });

  const key = roomKey(code);
  const room = await redis.get(key);
  if (!room) return json(res, 404, { error: "Room not found" });
  if (room.status !== "lobby") return json(res, 409, { error: "Only in lobby" });

  room.mode = mode === "custom" ? "custom" : "random";
  room.timerSeconds = timerSeconds;

  // reset readiness on changes to avoid mismatch
  room.startAt = null;
  room.random.hostSecret = null;
  room.random.guestSecret = null;

  if (room.mode === "random") room.wordLength = 5;

  for (const pid of ["host", "guest"]) {
    const p = room.players[pid];
    if (!p) continue;
    p.ready = false;
    p.secretForOpponent = null;
    p.guesses = [];
    p.results = [];
    p.score = 0;
    p.finishedAt = null;
  }

  room.lastUpdate = Date.now();
  await redis.set(key, room, { ex: 60 * 60 });

  return json(res, 200, { ok: true, room: publicRoom(room) });
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}
