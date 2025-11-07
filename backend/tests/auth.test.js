// backend/tests/auth.test.js
const express = require('express');
const request = require('supertest');
const { ObjectId } = require('mongodb');

// --- Mocks that must be declared before requiring ../auth ---
jest.mock('bcryptjs', () => ({
  hash: jest.fn(async (pw) => `hashed(${pw})`),
  compare: jest.fn(async (pw, hash) => hash === `hashed(${pw})`)
}));

jest.mock('../createJWT.js', () => ({
  createToken: jest.fn((fn, ln, id) => ({ accessToken: `signed(${fn}.${ln}.${id})` }))
}));

// Prevent real email + token work during tests
jest.mock('../mail', () => ({
  sendMail: jest.fn(async () => {
    // no-op to avoid hitting SendGrid and to silence warnings
    return;
  })
}));

jest.mock('../tokenStore', () => ({
  issueToken: jest.fn(async () => ({ raw: 'test-token-123' })),
  consumeToken: jest.fn(async () => ({ ok: true })),   // not used here but safe defaults
  validateToken: jest.fn(async () => ({ ok: true }))   // not used here but safe defaults
}));

function mkUsersColl() {
  const api = {
    _docs: new Map(),
    findOne: jest.fn(async (filter) => {
      if (filter.email) return api._docs.get(`email:${filter.email}`) || null;
      if (filter._id)   return api._docs.get(`id:${String(filter._id)}`) || null;
      return null;
    }),
    insertOne: jest.fn(async (doc) => {
      const _id = new ObjectId('64a000000000000000000001');
      const stored = { ...doc, _id };
      api._docs.set(`id:${String(_id)}`, stored);
      api._docs.set(`email:${doc.email}`, stored);
      return { insertedId: _id, acknowledged: true };
    }),
    // updateOne is used by auth.js for user updates elsewhere; add a harmless impl:
    updateOne: jest.fn(async (filter, update) => {
      const key = `id:${String(filter._id)}`;
      const existing = api._docs.get(key);
      if (!existing) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      const next = { ...existing, ...(update.$set || {}) };
      api._docs.set(key, next);
      api._docs.set(`email:${next.email}`, next);
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    })
  };
  return api;
}

function mkClient(usersColl) {
  return {
    db: () => ({
      collection: (name) => (name === 'users' ? usersColl : {
        // If auth.js ever touches other collections in tests, keep them harmless:
        findOne: jest.fn(async () => null),
        insertOne: jest.fn(async () => ({ insertedId: new ObjectId() })),
        updateOne: jest.fn(async () => ({ acknowledged: true, matchedCount: 1, modifiedCount: 1 }))
      })
    })
  };
}

function buildApp(usersColl) {
  const app = express();
  app.use(express.json());
  // Make sure env resembles local dev while tests run:
  process.env.NODE_ENV = 'test';
  process.env.FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  process.env.BACKEND_BASE_URL  = process.env.BACKEND_BASE_URL  || 'http://localhost:5000/api';

  const auth = require('../auth');
  const client = mkClient(usersColl);
  auth.setApp(app, client);
  return app;
}

let bcrypt, jwtLib, usersColl, app;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  bcrypt = require('bcryptjs');
  jwtLib = require('../createJWT.js');
  usersColl = mkUsersColl();
  app = buildApp(usersColl);
});

describe('auth.js', () => {
  describe('POST /api/register', () => {
    it('returns 400 if missing fields', async () => {
      const res = await request(app).post('/api/register').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'missing_fields' });
    });

    it('returns 409 if user exists', async () => {
      usersColl._docs.set('email:alice@example.com', {
        _id: new ObjectId('64a000000000000000000002'),
        email: 'alice@example.com'
      });
      const res = await request(app).post('/api/register').send({
        firstName: 'Alice', lastName: 'Lee', email: 'Alice@Example.com', password: 'secret123'
      });
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: 'User already exists' });
    });

    it('returns 200 and verification message on success', async () => {
      const res = await request(app).post('/api/register').send({
        firstName: 'Bob', lastName: 'Ray', email: 'bob@example.com', password: 'secret123'
      });
      expect(res.status).toBe(200);
      expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
      expect(res.body).toEqual({ ok: true, message: 'Registered. Check your email to verify.' });
    });
  });

  describe('POST /api/login', () => {
    it('returns 400 if missing fields', async () => {
      const res = await request(app).post('/api/login').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'missing_fields' });
    });

    it('returns 401 if user not found (message from auth.js)', async () => {
      const res = await request(app).post('/api/login').send({ email: 'x@y.com', password: 'p' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid email' });
    });

    it('returns 401 if password is wrong (for verified user)', async () => {
      usersColl._docs.set('email:jane@example.com', {
        _id: new ObjectId('64a000000000000000000003'),
        email: 'jane@example.com',
        passwordHash: 'hashed(correct)',
        isVerified: true
      });
      const res = await request(app).post('/api/login').send({ email: 'jane@example.com', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid password' });
    });

    it('returns 401 if user exists but not verified', async () => {
      usersColl._docs.set('email:nov@example.com', {
        _id: new ObjectId('64a000000000000000000099'),
        email: 'nov@example.com',
        passwordHash: 'hashed(secret123)',
        isVerified: false
      });
      const res = await request(app).post('/api/login').send({ email: 'nov@example.com', password: 'secret123' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'User email not verified' });
    });

    it('returns 200 and token on success (verified user)', async () => {
      const id = new ObjectId('64a000000000000000000004');
      usersColl._docs.set('email:sue@example.com', {
        _id: id,
        firstName: 'Sue',
        lastName: 'Q',
        email: 'sue@example.com',
        passwordHash: 'hashed(secret123)',
        isVerified: true
      });
      const res = await request(app).post('/api/login').send({ email: 'sue@example.com', password: 'secret123' });
      expect(res.status).toBe(200);
      expect(jwtLib.createToken).toHaveBeenCalledWith('Sue', 'Q', expect.any(ObjectId));
      expect(res.body).toEqual({ accessToken: `signed(Sue.Q.${id})` });
    });
  });
});
