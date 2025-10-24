// server.js  (API-only)
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();

// --- DB ---
const url = process.env.MONGODB_URI;
if (!url) {
  console.error('❌ MONGODB_URI is missing. Check backend/.env');
  process.exit(1);
}
const client = new MongoClient(url);
(async () => {
  try {
    await client.connect();
    console.log('✅ Mongo connected');
  } catch (err) {
    console.error('❌ Mongo connect failed:', err);
    process.exit(1);
  }
})();

// --- Middleware ---
app.use(cors());
app.use(express.json());

app.get('/__ping', (_req, res) => res.json({ ok: true, where: 'server.js' }));

// --- API routes ---
const api = require('./api.js');
const auth = require('./auth.js');  

auth.setApp(app, client);
api.setApp(app, client);


// Optional healthcheck
app.get('/api/ping', (_req, res) => res.json({ ok: true }));

// DO NOT serve frontend here; nginx will handle it.

// --- Start ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API listening on ${PORT}`);
});
