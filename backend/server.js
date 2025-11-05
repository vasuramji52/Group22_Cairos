// server.js  (API-only)
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { ensureIndexes } = require('./tokenStore');

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
    console.log('✅ Mongo connected');

    // 2. ensure token indexes
    const db = client.db('COP4331Cards');
    await ensureIndexes(db);
    console.log('✅ Token indexes ensured');

    // 3. middleware
    app.use(cors());
    app.use(express.json());

    // 4. basic ping route
    app.get('/__ping', (_req, res) => res.json({ ok: true, where: 'server.js' }));

    // 5. mount API routes
    const api = require('./api.js');
    const auth = require('./auth.js');
    const availability = require('./availability.js');

    auth.setApp(app, client);
    if (api.setApp) {
      api.setApp(app, client);
    }
    availability.setApp(app, client);

    // optional healthcheck
    app.get('/api/ping', (_req, res) => res.json({ ok: true }));

    // 6. start server
    app.get('/debug-direct', (req, res) => {
  res.json({ ok: true, msg: 'direct route from server.js' });
});
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ API listening on ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
}

// actually run it
start();
