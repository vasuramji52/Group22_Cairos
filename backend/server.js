// server.js  (API-only)
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const { ensureIndexes } = require("./tokenStore");

const app = express();

// --- DB ---
const url = process.env.MONGODB_URI;
if (!url) {
  console.error("❌ MONGODB_URI is missing. Check backend/.env");
  process.exit(1);
}
const client = new MongoClient(url);

// we do everything in order, one time
async function start() {
  try {
    // 1. connect to db
    await client.connect();
    console.log("✅ Mongo connected");

    // 2. ensure token indexes
    const db = client.db("COP4331Cards");
    await ensureIndexes(db);
    console.log("✅ Token indexes ensured");

    // 3. middleware
    const allowedOrigins = [
      "http://localhost:5173",       // local React
      "http://127.0.0.1:5173",
      "https://vasupradha.xyz",      // production React
      "https://www.vasupradha.xyz"
    ];

    const corsOptions = {
      origin: function (origin, cb) {
        if (!origin) return cb(null, true);

        // Allow ALL localhost ports (Flutter Web, React Dev)
        if (origin.startsWith("http://localhost")) return cb(null, true);
        if (origin.startsWith("http://127.0.0.1")) return cb(null, true);

        // Allow LAN IP access (mobile/Flutter Web)
        if (origin.startsWith("http://192.168.86.")) return cb(null, true);

        // Production
        if (
          origin === "https://vasupradha.xyz" ||
          origin === "https://www.vasupradha.xyz"
        ) {
          return cb(null, true);
        }

        return cb(new Error("CORS blocked: " + origin));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-platform"],
      credentials: true
    };

    app.use(cors(corsOptions));
    app.options(/.*/, cors(corsOptions));
    app.use(express.json());

    console.log("🌎 Running backend with BASE URL:", process.env.BACKEND_BASE_URL);
    require("dotenv").config({ path: require("path").join(__dirname, ".env") });

    // 4. basic ping route
    app.get("/__ping", (_req, res) =>
      res.json({ ok: true, where: "server.js" })
    );

    // 5. mount API routes
    const api = require("./api.js");
    const auth = require("./auth.js");
    const me = require("./me.js");
    const oauth = require('./oauth.google.js');
    const friend = require('./friends.js')

    auth.setApp(app, client);
    if (api.setApp) {
      api.setApp(app, client);
    }
    me.setApp(app, client);
    oauth.setApp(app, client);
    friend.setApp(app, client);
    // optional healthcheck
    app.get("/api/ping", (_req, res) => res.json({ ok: true }));

    // 6. start server
    app.get("/debug-direct", (req, res) => {
      res.json({ ok: true, msg: "direct route from server.js" });
    });
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ API listening on ${PORT}`);
      console.log(`🌍 Environment base URL: ${process.env.BACKEND_BASE_URL}`);
    });
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

// actually run it
start();
