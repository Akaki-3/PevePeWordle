import { redis, json, roomKey, normalizeWord, isValidWordLen, publicRoom } from "./_redis.js";

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

  // room mode is source of truth; host syncs it via config, but allow setWord to set it too (safe)
  room.mode = mode === "custom" ? "custom" : "random";
  room.timerSeconds = timerSeconds;

  if (room.mode === "custom") {
    if (!isValidWordLen(word, 5, 20)) {
      return json(res, 400, { error: "Word must be 5–20 letters (A–Z only)" });
    }

    if (playerId === "host") {
      room.wordLength = word.length;
      room.players.host.secretForOpponent = word;
      room.players.host.ready = true;

      if (room.players.guest?.secretForOpponent && room.players.guest.secretForOpponent.length !== room.wordLength) {
        room.players.guest.ready = false;
      }
    } else {
      if (room.players.host.secretForOpponent && word.length !== room.wordLength) {
        return json(res, 400, { error: `Your word must be ${room.wordLength} letters (match host)` });
      }
      room.players.guest.secretForOpponent = word;
      room.players.guest.ready = true;

      if (!room.players.host.secretForOpponent) {
        room.wordLength = word.length;
      }
    }
  } else {
    room.wordLength = 5;
    room.players[playerId].ready = true;
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
