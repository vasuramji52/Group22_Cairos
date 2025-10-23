// // --- Load env FIRST ---
// require('dotenv').config({ path: __dirname + '/.env' });
// console.log('ENV loaded:', {
//   PORT: process.env.PORT,
//   DB_NAME: process.env.DB_NAME,
//   MONGODB_URI_preview: (process.env.MONGODB_URI || '').slice(0, 60) + '…'
// });

// const express = require('express');
// const cors = require('cors');
// const { MongoClient } = require('mongodb');

// const app = express();
// app.use(cors());
// app.use(express.json());

// // --- Build Mongo client from env ---
// const url = process.env.MONGODB_URI;
// if (!url) {
//   console.error('❌ MONGODB_URI is missing. Check backend/.env');
//   process.exit(1);
// }
// const client = new MongoClient(url, {
//   // optional but helpful in dev:
//   serverSelectionTimeoutMS: 10000,
// });

// // --- Add simple debug routes BEFORE starting ---
// app.get('/api/ping', (req, res) => res.json({ ok: true }));
// app.get('/__debug/db', async (req, res) => {
//   try {
//     const DB_NAME = process.env.DB_NAME || 'COP4331Cards';
//     const db = client.db(DB_NAME);
//     const usersCount = await db.collection('users').countDocuments();
//     const one = await db.collection('users').findOne({}, { projection: { email: 1, isVerified: 1 } });
//     res.json({ DB_NAME, usersCount, sampleUser: one });
//   } catch (e) {
//     res.status(500).json({ error: String(e) });
//   }
// });

// // --- Connect THEN mount routes THEN listen ---
// (async () => {
//   try {
//     await client.connect();
//     console.log('✅ Connected to MongoDB');

//     const api = require('./api.js');
//     api.setApp(app, client);

//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, '0.0.0.0', () => {
//       console.log(`✅ Server running on port ${PORT}`);
//     });
//   } catch (err) {
//     console.error('❌ Mongo connect failed:', err?.message || err);
//     process.exit(1);
//   }
// })();


// --- Load env FIRST ---
require('dotenv').config({ path: __dirname + '/.env' });
console.log('ENV loaded:', {
  PORT: process.env.PORT,
  DB_NAME: process.env.DB_NAME,
  MONGODB_URI_preview: (process.env.MONGODB_URI || '').slice(0, 60) + '…'
});

const path = require('path');
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(cors());                // same-origin is fine; leaving permissive is OK for now
app.use(express.json());

// --- Build Mongo client from env ---
const url = process.env.MONGODB_URI;
if (!url) {
  console.error('❌ MONGODB_URI is missing. Check backend/.env');
  process.exit(1);
}
const client = new MongoClient(url, { serverSelectionTimeoutMS: 10000 });

// --- Simple debug routes BEFORE starting ---
app.get('/api/ping', (req, res) => res.json({ ok: true }));
app.get('/__debug/db', async (req, res) => {
  try {
    const DB_NAME = process.env.DB_NAME || 'COP4331Cards'; // use your real default
    const db = client.db(DB_NAME);
    const usersCount = await db.collection('users').countDocuments();
    const one = await db.collection('users').findOne({}, { projection: { email: 1, isVerified: 1 } });
    res.json({ DB_NAME, usersCount, sampleUser: one });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// --- Connect THEN mount routes THEN static/frontend THEN listen ---
(async () => {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    // 1) API routes first
    const api = require('./api.js');
    api.setApp(app, client);

    // 2) Serve the built Vite frontend (adjust path if your build lives elsewhere)
    const distDir = path.resolve(__dirname, 'api/frontend/dist');
    app.use(express.static(distDir));

    // 3) SPA fallback: any GET not handled above returns index.html
        app.get(/^(?!\/(auth|friends|google)(\/|$)).*$/, (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });


    // 4) Listen
    const PORT = Number(process.env.PORT || 5000);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Mongo connect failed:', err?.message || err);
    process.exit(1);
  }
})();


