import { redis, json, roomKey, normalizeWord, isValidWord } from "./_redis.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  const body = await readJson(req);
  const code = String(body?.code || "").trim().toUpperCase();
  const playerId = String(body?.playerId || "");
  const mode = String(body?.mode || "random"); // random/custom
  const timerSeconds = Math.max(30, Math.min(600, Number(body?.timerSeconds || 120)));
  const word = normalizeWord(body?.word);

  const key = roomKey(code);
  const room = await redis.get(key);
  if (!room) return json(res, 404, { error: "Room not found" });
  if (room.status !== "lobby") return json(res, 409, { error: "Not in lobby" });
  if (playerId !== "host" && playerId !== "guest") return json(res, 400, { error: "Bad playerId" });
  if (playerId === "guest" && !room.players.guest) return json(res, 409, { error: "No guest yet" });

  room.mode = (mode === "custom") ? "custom" : "random";
  room.timerSeconds = timerSeconds;

  if (room.mode === "custom") {
    if (!isValidWord(word)) return json(res, 400, { error: "Word must be 5 letters A-Z" });
    if (playerId === "host") room.players.host.secretForOpponent = word;
    if (playerId === "guest") room.players.guest.secretForOpponent = word;
    room.players[playerId].ready = true;
  } else {
    room.players[playerId].ready = true;
  }

  room.lastUpdate = Date.now();
  await redis.set(key, room, { ex: 60 * 60 });
  return json(res, 200, { ok: true, room: publicRoom(room) });
}

function publicRoom(room) {
  const cleanPlayer = (p) => !p ? null : ({
    id: p.id, name: p.name, ready: p.ready,
    guesses: p.guesses, results: p.results, score: p.score, finishedAt: p.finishedAt
  });

  return {
    code: room.code,
    status: room.status,
    mode: room.mode,
    timerSeconds: room.timerSeconds,
    startAt: room.startAt,
    players: { host: cleanPlayer(room.players.host), guest: cleanPlayer(room.players.guest) }
  };
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { return {}; }
}
