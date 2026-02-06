import { redis, json } from "./_redis.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return json(res, 405, { error: "GET or POST only" });
  }

  try {
    // Get all room keys
    const keys = await redis.keys("room:*");
    const publicRooms = [];

    // Check each room to see if it's public and waiting
    for (const key of keys) {
      const room = await redis.get(key);
      if (!room) continue;

      // Only show rooms that are:
      // 1. Public (isPublic === true)
      // 2. In lobby status (waiting for players)
      // 3. Don't have a guest yet
      if (room.isPublic && room.status === "lobby" && !room.players.guest) {
        publicRooms.push({
          code: room.code,
          hostName: room.players.host?.name || "Player",
          mode: room.mode,
          timerSeconds: room.timerSeconds,
          wordLength: room.wordLength,
          createdAt: room.createdAt,
          // Don't expose sensitive data
        });
      }
    }

    // Sort by creation time (newest first)
    publicRooms.sort((a, b) => b.createdAt - a.createdAt);

    return json(res, 200, { rooms: publicRooms });
  } catch (error) {
    console.error("Error listing public rooms:", error);
    return json(res, 500, { error: "Failed to list rooms" });
  }
}
