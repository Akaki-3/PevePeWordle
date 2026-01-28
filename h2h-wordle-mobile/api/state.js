import { redis, json, roomKey } from "./_redis.js";

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = String(url.searchParams.get("code") || "").trim().toUpperCase();

  if (!code) return json(res, 400, { error: "Missing code" });

  const room = await redis.get(roomKey(code));
  if (!room) return json(res, 404, { error: "Room not found" });

  let remaining = null;
  if (room.status === "running" && room.startAt) {
    const elapsed = Math.floor((Date.now() - room.startAt) / 1000);
    remaining = Math.max(0, room.timerSeconds - elapsed);
    if (remaining === 0) {
      room.status = "finished";
      room.lastUpdate = Date.now();
      await redis.set(roomKey(code), room, { ex: 60 * 60 });
    }
  }

  return json(res, 200, { room: publicRoom(room), remaining });
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
