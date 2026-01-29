import { redis, json, roomKey, normalizeWord, isValidWordLen, evaluateGuess, publicRoom } from "./_redis.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  const body = await readJson(req);
  const code = String(body?.code || "").trim().toUpperCase();
  const playerId = String(body?.playerId || "");
  const guessRaw = normalizeWord(body?.guess);

  const key = roomKey(code);
  const room = await redis.get(key);
  if (!room) return json(res, 404, { error: "Room not found" });
  if (room.status !== "running") return json(res, 409, { error: "Game not running" });
  if (playerId !== "host" && playerId !== "guest") return json(res, 400, { error: "Bad playerId" });
  if (playerId === "guest" && !room.players.guest) return json(res, 409, { error: "No guest" });

  const now = Date.now();
  const elapsed = Math.floor((now - room.startAt) / 1000);
  const remaining = room.timerSeconds - elapsed;
  if (remaining <= 0) {
    room.status = "finished";
    room.lastUpdate = Date.now();
    await redis.set(key, room, { ex: 60 * 60 });
    return json(res, 409, { error: "Time is up" });
  }

  const secret = playerId === "host" ? room.random.hostSecret : room.random.guestSecret;
  const N = secret.length;

  if (!isValidWordLen(guessRaw, N, N)) {
    return json(res, 400, { error: `Guess must be exactly ${N} letters (A–Z)` });
  }

  const p = room.players[playerId];
  if (p.finishedAt) return json(res, 409, { error: "You already finished" });
  if (p.guesses.length >= 6) return json(res, 409, { error: "No guesses left" });
  if (p.guesses.includes(guessRaw)) return json(res, 409, { error: "Already guessed" });

  const pattern = evaluateGuess(secret, guessRaw);

  p.guesses.push(guessRaw);
  p.results.push(pattern);

  const won = guessRaw === secret;
  if (won) {
    p.finishedAt = now;
    const guessBonus = (7 - p.guesses.length) * 10;
    p.score = 100 + Math.max(0, remaining) + guessBonus;
  } else if (p.guesses.length >= 6) {
    p.finishedAt = now;
    p.score = 0;
  }

  const hostDone = !!room.players.host.finishedAt;
  const guestDone = !!room.players.guest.finishedAt;
  const elapsed2 = Math.floor((Date.now() - room.startAt) / 1000);

  if (elapsed2 >= room.timerSeconds || (hostDone && guestDone)) {
    room.status = "finished";
  }

  room.lastUpdate = Date.now();
  await redis.set(key, room, { ex: 60 * 60 });

  return json(res, 200, { ok: true, pattern, won, room: publicRoom(room) });
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
