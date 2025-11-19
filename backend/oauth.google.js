// oauth.google.js
//const { default: fetch } = require('node-fetch'); // if Node < 18; else global fetch
const { requireAuth } = require('./auth.middleware');
const { ObjectId } = require('mongodb');
const { enc } = require('./crypto.util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const GOOGLE_AUTHZ = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN  = 'https://oauth2.googleapis.com/token';
// const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
// add openid (+ email if you want the email too)
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  "https://www.googleapis.com/auth/calendar",
  'openid',
  'email'
];

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
const BACKEND_BASE_URL  = process.env.BACKEND_BASE_URL  || 'http://localhost:5000';
const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI  = process.env.GOOGLE_REDIRECT_URI;

// Make a signed/opaque state with userId + CSRF
function makeState({ userId }) {
  const csrf = crypto.randomBytes(16).toString('hex');
  const payload = { userId, csrf, t: Date.now() };
  // signed (HS256) so we can verify it on callback
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}
function parseState(state) {
  try { return jwt.verify(state, process.env.ACCESS_TOKEN_SECRET); }
  catch { return null; }
}

exports.setApp = function setApp(app, client) {
  const db = client.db('COP4331Cards');

  // GET /api/oauth/google/init  (must be logged in)
  app.get('/api/oauth/google/init', requireAuth, async (req, res) => {
    if (!CLIENT_ID || !REDIRECT_URI) {
      return res.status(500).json({ error: 'google_oauth_not_configured' });
    }
    const state = makeState({ userId: req.userId });

    const url = new URL(GOOGLE_AUTHZ);
    url.searchParams.set('client_id', CLIENT_ID);
    url.searchParams.set('redirect_uri', REDIRECT_URI);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', SCOPES.join(' '));
    url.searchParams.set('access_type', 'offline');          // want refresh token
    url.searchParams.set('prompt', 'consent');               // ensure refresh on re-consent
    url.searchParams.set('include_granted_scopes', 'true');
    url.searchParams.set('state', state);

    res.json({ url: url.toString() });
  });

  // GET /api/oauth/google/callback?code&state
  app.get('/api/oauth/google/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code || !state) return res.status(400).send('Missing code or state');

      const parsed = parseState(state);
      if (!parsed?.userId) return res.status(400).send('Bad state');
      const userId = parsed.userId;

      // Exchange code → tokens
      const body = new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      });

      const r = await fetch(GOOGLE_TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      if (!r.ok) {
        const t = await r.text();
        console.error('Google token error:', t);
        return res.status(400).send('OAuth exchange failed');
      }
      const tokens = await r.json();
      const refreshToken = tokens.refresh_token;     // may be null if Google didn’t return (depends on prior consent)
      const accessToken  = tokens.access_token;
      const expiresIn    = tokens.expires_in;        // seconds
      const idToken      = tokens.id_token;          // JWT with Google account info

      // Extract Google account ID (sub) from id_token if present
      let accountId = null;
      try {
        if (idToken) {
          const decoded = jwt.decode(idToken);
          accountId = decoded?.sub || null;
        }
      } catch {}

      // Store credentials in googleCreds (encrypted refresh token)
      const now = new Date();
      const updates = {
        userId: new ObjectId(userId),
        updatedAt: now,
      };

      if (refreshToken) {
        updates.refreshTokenEnc = enc(refreshToken);  // {v:'v1', data:'...'}
      }
      if (accessToken) {
        updates.accessTokenEnc = enc(accessToken);
        updates.accessTokenExpiresAt = new Date(Date.now() + (Number(expiresIn || 0) * 1000));
      }
      await db.collection('googleCreds').updateOne(
        { userId: new ObjectId(userId) },
        { $set: { ...updates }, $setOnInsert: { createdAt: now, scopes: SCOPES } },
        { upsert: true }
      );

      // Mark user.google.connected = true and optionally store accountId
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { 'google.connected': true, 'google.accountId': accountId, updatedAt: new Date() } }
      );

      // Redirect back to the app
      return res.redirect(`${FRONTEND_BASE_URL}/cards?google=connected`);
    } catch (e) {
      console.error('OAuth callback error:', e);
      return res.status(500).send('Server error');
    }
  });
};
