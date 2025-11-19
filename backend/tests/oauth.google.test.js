// backend/tests/oauth.google.test.js

// Keep tests isolated
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

// Mock requireAuth to inject req.userId
jest.mock('../auth.middleware', () => ({
  requireAuth: (req, _res, next) => {
    req.userId = '507f1f77bcf86cd799439011';
    next();
  },
}));

const express = require('express');
const request = require('supertest');

// Hoisted mock factory for jsonwebtoken (module will be re-required per test)
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload) => `signed(${payload.userId})`),
  verify: jest.fn(),
  decode: jest.fn(),
}));

describe('oauth.google routes', () => {
  function buildApp({ tokenResponse } = {}) {
    const app = express();

    const googleCreds = {
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };
    const users = {
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
    };

    const client = {
      db: () => ({
        collection: (name) =>
          name === 'googleCreds'
            ? googleCreds
            : users,
      }),
    };

    // Mock fetch for the token exchange (can be overridden in specific tests)
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => tokenResponse || {},
      text: async () => JSON.stringify(tokenResponse || {}),
    });

    const oauth = require('../oauth.google');
    oauth.setApp(app, client);
    return { app, googleCreds, users };
  }

  //
  // INIT
  //
  test('init builds auth URL with state', async () => {
    // Ensure env has config so the "configured" path is taken
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost/google/callback';

    const { app } = buildApp({ tokenResponse: {} });
    const res = await request(app).get('/api/oauth/google/init');

    expect(res.status).toBe(200);
    expect(res.body.url).toContain(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );

    // Parse and assert decoded params (avoid %28/%29 encoding issues)
    const u = new URL(res.body.url);
    expect(u.searchParams.get('client_id')).toBe('test-client-id');
    expect(u.searchParams.get('state')).toMatch(/^signed\(/);
  });

  // NEW: cover line 43 – google_oauth_not_configured branch
  test('init returns 500 if Google OAuth is not configured', async () => {
    // Force CLIENT_ID / REDIRECT_URI to be falsy at require time
    process.env.GOOGLE_CLIENT_ID = '';
    process.env.GOOGLE_REDIRECT_URI = '';

    const { app } = buildApp({ tokenResponse: {} });
    const res = await request(app).get('/api/oauth/google/init');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'google_oauth_not_configured' });
  });

  //
  // CALLBACK – happy path
  //
  test('callback happy path redirects and updates DB', async () => {
    // IMPORTANT: re-require the mock after reset to get the "current" instance
    const jwt = require('jsonwebtoken');
    jwt.verify.mockReturnValue({
      userId: '507f1f77bcf86cd799439011',
      csrf: 'x',
    });
    jwt.decode.mockReturnValue({ sub: 'google-account-123' });

    const tokenResponse = {
      access_token: 'ya29.token',
      refresh_token: '1//refresh',
      expires_in: 3600,
      id_token: 'id.jwt',
    };

    const { app, googleCreds, users } = buildApp({ tokenResponse });

    const res = await request(app)
      .get('/api/oauth/google/callback')
      .query({ code: 'authcode', state: 'signed(dummy)' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(
      'http://localhost:5173/cards?google=connected',
    );

    expect(googleCreds.updateOne).toHaveBeenCalledTimes(1);
    expect(users.updateOne).toHaveBeenCalledWith(
      { _id: expect.anything() },
      {
        $set: {
          'google.connected': true,
          'google.accountId': 'google-account-123',
          updatedAt: expect.any(Date),
        },
      },
    );
  });

  test('callback 400 if missing query params', async () => {
    const { app } = buildApp({ tokenResponse: {} });
    const res = await request(app).get('/api/oauth/google/callback');
    expect(res.status).toBe(400);
  });

  // NEW: cover line 34 – parseState catch (jwt.verify throws → null)
  test('callback returns 400 Bad state when state cannot be parsed', async () => {
    const jwt = require('jsonwebtoken');
    // Make parseState() hit its catch block
    jwt.verify.mockImplementation(() => {
      throw new Error('bad state token');
    });

    const { app } = buildApp({ tokenResponse: {} });

    const res = await request(app)
      .get('/api/oauth/google/callback')
      .query({ code: 'some-code', state: 'broken-state' });

    expect(res.status).toBe(400);
    expect(res.text).toContain('Bad state');
  });

  // NEW: cover lines 85–87 – Google token exchange failure path
  test('callback returns 400 when Google token exchange fails', async () => {
    const jwt = require('jsonwebtoken');
    jwt.verify.mockReturnValue({
      userId: '507f1f77bcf86cd799439011',
      csrf: 'x',
    });

    const { app } = buildApp({ tokenResponse: {} });

    // Override fetch to simulate non-OK response
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => 'some error payload',
    });

    const res = await request(app)
      .get('/api/oauth/google/callback')
      .query({ code: 'authcode', state: 'signed(dummy)' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(400);
    expect(res.text).toContain('OAuth exchange failed');
  });

  // NEW: cover lines 133–134 – outer catch in callback (DB error)
  test('callback returns 500 when an internal error occurs (DB failure)', async () => {
    const jwt = require('jsonwebtoken');
    jwt.verify.mockReturnValue({
      userId: '507f1f77bcf86cd799439011',
      csrf: 'x',
    });

    const tokenResponse = {
      access_token: 'ya29.token',
      refresh_token: '1//refresh',
      expires_in: 3600,
      id_token: null,
    };

    const { app, googleCreds } = buildApp({ tokenResponse });

    // Force DB update to reject so the outer try/catch is triggered
    googleCreds.updateOne.mockRejectedValueOnce(new Error('DB exploded'));

    const res = await request(app)
      .get('/api/oauth/google/callback')
      .query({ code: 'authcode', state: 'signed(dummy)' });

    expect(res.status).toBe(500);
    expect(res.text).toContain('Server error');
  });
});
