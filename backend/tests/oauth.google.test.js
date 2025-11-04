// Keep tests isolated
beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

// Mock requireAuth to inject req.userId
jest.mock('../auth.middleware', () => ({
  requireAuth: (req, _res, next) => { req.userId = '507f1f77bcf86cd799439011'; next(); }
}));

const express = require('express');
const request = require('supertest');

// Hoisted mock factory for jsonwebtoken (module will be re-required per test)
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload) => `signed(${payload.userId})`),
  verify: jest.fn(),
  decode: jest.fn()
}));

describe('oauth.google routes', () => {
  function buildApp({ tokenResponse }) {
    const app = express();

    const googleCreds = { updateOne: jest.fn().mockResolvedValue({ acknowledged: true }) };
    const users = { updateOne: jest.fn().mockResolvedValue({ acknowledged: true }) };

    const client = {
      db: () => ({
        collection: (name) => (name === 'googleCreds' ? googleCreds : users)
      })
    };

    // Mock fetch for the token exchange
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => tokenResponse,
      text: async () => JSON.stringify(tokenResponse)
    });

    const oauth = require('../oauth.google');
    oauth.setApp(app, client);
    return { app, googleCreds, users };
  }

  test('init builds auth URL with state', async () => {
    const { app } = buildApp({ tokenResponse: {} });
    const res = await request(app).get('/api/oauth/google/init');

    expect(res.status).toBe(200);
    expect(res.body.url).toContain('https://accounts.google.com/o/oauth2/v2/auth');

    // Parse and assert decoded params (avoid %28/%29 encoding issues)
    const u = new URL(res.body.url);
    expect(u.searchParams.get('client_id')).toBeDefined();
    expect(u.searchParams.get('state')).toMatch(/^signed\(/);
  });

  test('callback happy path redirects and updates DB', async () => {
    // IMPORTANT: re-require the mock after reset to get the "current" instance
    const jwt = require('jsonwebtoken');
    jwt.verify.mockReturnValue({ userId: '507f1f77bcf86cd799439011', csrf: 'x' });
    jwt.decode.mockReturnValue({ sub: 'google-account-123' });

    const tokenResponse = {
      access_token: 'ya29.token',
      refresh_token: '1//refresh',
      expires_in: 3600,
      id_token: 'id.jwt'
    };

    const { app, googleCreds, users } = buildApp({ tokenResponse });

    const res = await request(app)
      .get('/api/oauth/google/callback')
      .query({ code: 'authcode', state: 'signed(dummy)' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('http://localhost:5173/cards?google=connected');

    expect(googleCreds.updateOne).toHaveBeenCalledTimes(1);
    expect(users.updateOne).toHaveBeenCalledWith(
      { _id: expect.anything() },
      { $set: { 'google.connected': true, 'google.accountId': 'google-account-123', updatedAt: expect.any(Date) } }
    );
  });

  test('callback 400 if missing query params', async () => {
    const { app } = buildApp({ tokenResponse: {} });
    const res = await request(app).get('/api/oauth/google/callback');
    expect(res.status).toBe(400);
  });
});
