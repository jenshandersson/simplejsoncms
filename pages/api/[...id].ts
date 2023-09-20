import type { NextApiRequest, NextApiResponse } from "next";
import Redis from "ioredis";

const kv = new Redis(process.env.KV_URL as string);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query } = req;
  const { id } = query;

  const data = await kv.get(`document-${id}`);
  console.log({ data });

  if (data) {
    const passHash = await kv.get("passwd-" + id);
    if (passHash) {
      res.setHeader("x-protected", "true");
    }
    return res.status(200).json(JSON.parse(data));
  }
  res.status(404).json({ status: "not found" });
}
// server.get("/api/:id", async (req, res) => {
//   const { id } = req.params;
//   const cached = await redisClient.get(id);
//   if (cached) {
//     const passHash = await redisClient.get("passwd-" + id);
//     const json = JSON.parse(cached);
//     if (passHash) {
//       res.set("x-protected", true);
//     }
//     if (!req.headers["x-skip-incr"]) {
//       await redisClient.incr("get-" + id);
//     }
//     return res.json(json);
//   }
//   // if (id === "f87al12d83w") {
//   //   const data = await fetch(
//   //     "https://jsonblob.com/api/jsonBlob/ba4226ac-d21a-11e8-88b0-8176dc2ca97e"
//   //   ).then(r => r.json());
//   //   redisClient.set(id, JSON.stringify(data), "EX", 30); // 30 seconds
//   //   return res.json(data);
//   // }

//   return res.status(404).json({ error: "JSON not found" });
// });
