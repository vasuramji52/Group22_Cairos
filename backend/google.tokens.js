// backend/google.tokens.js
const { ObjectId } = require('mongodb');
const { enc, dec } = require('./crypto.util');

// If Node < 18, uncomment and install: npm i node-fetch
// const fetch = (...args) => import('node-fetch').then(m => m.default(...args));

const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';

async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const r = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!r.ok) throw new Error(`Google refresh failed: ${await r.text()}`);
  return r.json(); // { access_token, expires_in, ... }
}

/**
 * Return a fresh access token for this userId (refreshes if needed).
 */
async function getGoogleAccessToken(db, userId) {
  const doc = await db.collection('googleCreds').findOne({ userId: new ObjectId(userId) });
  if (!doc) throw new Error('no_google_creds');

  // use cached access token if not expiring soon
  if (doc.accessTokenEnc && doc.accessTokenExpiresAt) {
    const exp = new Date(doc.accessTokenExpiresAt).getTime();
    if (Date.now() < exp - 60_000) {
      const token = dec(doc.accessTokenEnc);
      if (token) return token;
    }
  }

  const refreshToken = dec(doc.refreshTokenEnc);
  if (!refreshToken) throw new Error('no_refresh_token');

  const refreshed = await refreshAccessToken(refreshToken);
  const access = refreshed.access_token;
  const expiresIn = Number(refreshed.expires_in || 0);
  if (!access) throw new Error('refresh_missing_access_token');

  await db.collection('googleCreds').updateOne(
    { userId: new ObjectId(userId) },
    {
      $set: {
        accessTokenEnc: enc(access),
        accessTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        updatedAt: new Date(),
      },
    }
  );

  return access;
}

module.exports = { getGoogleAccessToken };
