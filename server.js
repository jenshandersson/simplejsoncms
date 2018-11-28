const express = require("express");
const next = require("next");
const fetch = require("node-fetch");
const cors = require("cors");
const bodyParser = require("body-parser");
const redis = require("redis");
const asyncRedis = require("async-redis");
const bcrypt = require("bcrypt");

const port = 2000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  server.use(cors());
  server.use(bodyParser.json());

  const syncRedisClient = redis.createClient();
  const redisClient = asyncRedis.decorate(syncRedisClient);

  redisClient.on("connect", () => {
    console.log("Redis client connected");
  });
  redisClient.on("error", err => {
    console.log(`Something went wrong ${err}`);
  });

  server.get("/editor/:id?", (req, res) => {
    const { id } = req.params;
    return app.render(req, res, "/editor", { id, json: !id && {} });
  });

  server.get("/", (req, res) => {
    return app.render(req, res, "/editor", { id: req.params.id });
  });

  server.use("/api/save", async (req, res) => {
    const { json, password } = req.body;
    let { id } = req.body;
    if (!id) {
      id = Math.random()
        .toString(36)
        .substring(2, 15);
    }

    const passHash = await redisClient.get("passwd-" + id);
    if (passHash) {
      if (!password || !bcrypt.compareSync(password, passHash)) {
        return res.status(401).json({
          error: password
            ? "Not authorized, incorrect password"
            : "Not authorized, password needed"
        });
      }
    } else if (password) {
      const hash = bcrypt.hashSync(password, 10);
      await redisClient.set("passwd-" + id, hash);
    }
    await redisClient.incr("save-" + id);
    await redisClient.set(id, JSON.stringify(json));
    return res.json({ id, json });
  });

  server.get("/api/:id", async (req, res) => {
    const { id } = req.params;
    const cached = await redisClient.get(id);
    if (cached) {
      const passHash = await redisClient.get("passwd-" + id);
      const json = JSON.parse(cached);
      if (passHash) {
        res.set("x-protected", true);
      }
      if (!req.headers["x-skip-incr"]) {
        await redisClient.incr("get-" + id);
      }
      return res.json(json);
    }
    // if (id === "f87al12d83w") {
    //   const data = await fetch(
    //     "https://jsonblob.com/api/jsonBlob/ba4226ac-d21a-11e8-88b0-8176dc2ca97e"
    //   ).then(r => r.json());
    //   redisClient.set(id, JSON.stringify(data), "EX", 30); // 30 seconds
    //   return res.json(data);
    // }

    return res.status(404).json({ error: "JSON not found" });
  });

  server.get("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
