import { redis, json, roomKey, publicRoom } from "./_redis.js";

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = String(url.searchParams.get("code") || "").trim().toUpperCase();
  if (!code) return json(res, 400, { error: "Missing code" });

  const key = roomKey(code);
  const room = await redis.get(key);
  if (!room) return json(res, 404, { error: "Room not found" });

  let remaining = null;
  if (room.status === "running" && room.startAt) {
    const elapsed = Math.floor((Date.now() - room.startAt) / 1000);
    remaining = Math.max(0, room.timerSeconds - elapsed);
    if (remaining === 0) {
      room.status = "finished";
      room.lastUpdate = Date.now();
      await redis.set(key, room, { ex: 60 * 60 });
    }
  }

  return json(res, 200, { room: publicRoom(room), remaining });
}
