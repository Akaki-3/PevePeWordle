import { redis, json, makeCode, roomKey } from "./_redis.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "POST only" });

  const body = await readJson(req);
  const name = String(body?.name || "").trim().slice(0, 24) || "Player";

  let code = makeCode();
  for (let i = 0; i < 4; i++) {
    const exists = await redis.get(roomKey(code));
    if (!exists) break;
    code = makeCode();
  }

  const room = {
    code,
    createdAt: Date.now(),
    mode: "random",
    status: "lobby",
    timerSeconds: 120,
    startAt: null,
    wordLength: 5,

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

  await redis.set(roomKey(code), room, { ex: 60 * 60 });
  return json(res, 200, { code, playerId: "host", name });
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
