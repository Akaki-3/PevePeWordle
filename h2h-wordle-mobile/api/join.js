import { redis, json, roomKey, publicRoom } from "./_redis.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  const body = await readJson(req);
  const code = String(body?.code || "").trim().toUpperCase();
  const name = String(body?.name || "").trim().slice(0, 24) || "Player";

  const key = roomKey(code);
  const room = await redis.get(key);
  if (!room) return json(res, 404, { error: "Room not found" });
  if (room.status !== "lobby") return json(res, 409, { error: "Game already started" });

  if (room.players.guest) {
    // allow rejoin as guest (simple)
    room.players.guest.name = name;
  } else {
    room.players.guest = {
      id: "guest",
      name,
      ready: false,
      secretForOpponent: null,
      guesses: [],
      results: [],
      score: 0,
      finishedAt: null
    };
  }

  room.lastUpdate = Date.now();
  await redis.set(key, room, { ex: 60 * 60 });

  return json(res, 200, { code, playerId: "guest", name, room: publicRoom(room) });
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
