import type { NextApiRequest, NextApiResponse } from "next";
import Redis from "ioredis";
import bcrypt from "bcrypt";

const kv = new Redis(process.env.KV_URL as string);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { json, password } = req.body;
  let { id } = req.body;
  if (!id) {
    id = Math.random().toString(36).substring(2, 15);
  }
  const key = `document-${id}`;
  const passHash = await kv.get("passwd-" + id);
  if (passHash) {
    if (!password || !bcrypt.compareSync(password, passHash)) {
      return res.status(401).json({
        error: password
          ? "Not authorized, incorrect password"
          : "Not authorized, password needed",
      });
    }
  } else if (password) {
    const hash = bcrypt.hashSync(password, 10);
    await kv.set("passwd-" + id, hash);
  }
  await kv.set(key, JSON.stringify(json));
  return res.json({ id, json });
}
