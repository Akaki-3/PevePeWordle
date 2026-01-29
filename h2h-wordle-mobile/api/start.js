import { redis, json, roomKey, publicRoom } from "./_redis.js";

const WORDS5 = [
  "about","other","which","their","there","apple","spice","crane","stone","light",
  "smile","fresh","brick","chair","crown","trust","tears","laugh","power","dance",
  "zesty","sugar","green","black","white","flame","glory","heart","dream","storm"
];

function pick5() {
  return WORDS5[Math.floor(Math.random() * WORDS5.length)];
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
      return json(res, 409, { error: "Both must set a word" });
    }

    // guest solves host word, host solves guest word (lengths can differ)
    room.random.guestSecret = room.players.host.secretForOpponent;
    room.random.hostSecret  = room.players.guest.secretForOpponent;

    room.wordLengths = {
      host: room.random.hostSecret.length,
      guest: room.random.guestSecret.length
    };
  } else {
    room.wordLength = 5;
    room.random.hostSecret = pick5();
    room.random.guestSecret = pick5();
    room.wordLengths = { host: 5, guest: 5 };
  }

  room.status = "running";
  room.startAt = Date.now();

  for (const pid of ["host","guest"]) {
    const p = room.players[pid];
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
