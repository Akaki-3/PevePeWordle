import { redis, json, makeCode, roomKey } from "./_redis.js";

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "POST only" });
  }

  const body = await readJson(req);
  const name = String(body?.name || "").trim().slice(0, 24) || "Player";

  try {
    // First, try to find an available public room
    const keys = await redis.keys("room:*");
    
    for (const key of keys) {
      const room = await redis.get(key);
      if (!room) continue;

      // Found a public room waiting for a player
      if (room.isPublic && room.status === "lobby" && !room.players.guest) {
        // Join this room as guest
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
        room.lastUpdate = Date.now();

        await redis.set(key, room, { ex: 60 * 60 });

        return json(res, 200, {
          code: room.code,
          playerId: "guest",
          name,
          joined: true
        });
      }
    }

    // No available public rooms found - create a new one
    let code = makeCode();
    for (let i = 0; i < 4; i++) {
      const exists = await redis.get(roomKey(code));
      if (!exists) break;
      code = makeCode();
    }

    const newRoom = {
      code,
      createdAt: Date.now(),
      mode: "random",
      status: "lobby",
      timerSeconds: 120,
      startAt: null,
      wordLength: 5,
      isPublic: true, // Mark as public

      players: {
        host: {
          id: "host",
          name,
          ready: false,
          secretForOpponent: null,
          guesses: [],
          results: [],
          score: 0,
          finishedAt: null
        },
        guest: null
      },

      random: {
        hostSecret: null,
        guestSecret: null
      },

      lastUpdate: Date.now()
    };

    await redis.set(roomKey(code), newRoom, { ex: 60 * 60 });

    return json(res, 200, {
      code,
      playerId: "host",
      name,
      created: true
    });

  } catch (error) {
    console.error("Quick match error:", error);
    return json(res, 500, { error: "Failed to find or create room" });
  }
}
