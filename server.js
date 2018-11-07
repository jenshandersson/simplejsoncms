const express = require("express");
const next = require("next");
const fetch = require("node-fetch");
const port = parseInt(process.env.PORT, 10) || 2000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

var LRU = require("lru-cache"),
  options = { maxAge: 1000 * 10 },
  cache = LRU(options);

app.prepare().then(() => {
  const server = express();

  server.get("/editor/:id?", (req, res) => {
    return app.render(req, res, "/editor", { id: req.params.id });
  });

  server.get("/api/f87al12d83w", async (req, res) => {
    const cached = cache.get("f87al12d83w");
    if (cached) {
      return res.json(data);
    }
    const data = await fetch(
      "https://jsonblob.com/api/jsonBlob/ba4226ac-d21a-11e8-88b0-8176dc2ca97e"
    ).then(r => r.json());
    cache.set("f87al12d83w", cached);

    return res.json(data);
  });

  server.get("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
