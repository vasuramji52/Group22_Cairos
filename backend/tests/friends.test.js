// backend/tests/friends.test.js
const express = require('express');
const request = require('supertest');
const { ObjectId } = require('mongodb');

jest.mock('../auth.middleware', () => ({
  requireAuth: jest.fn((req, res, next) => { req.userId = '64a000000000000000000001'; next(); })
}));

// Import requireAuth from the mocked module so we can use mockImplementationOnce
const { requireAuth } = require('../auth.middleware');

function mkUsersColl() {
  const api = {
    _docs: new Map(),
    findOne: jest.fn(async (filter) => {
      if (filter._id) return api._docs.get(`id:${String(filter._id)}`) || null;
      if (filter.email) return api._docs.get(`email:${filter.email}`) || null;
      return null;
    }),
    updateOne: jest.fn(async () => ({ acknowledged: true })),
    find: jest.fn((filter) => ({
      toArray: jest.fn(async () => {
        if (filter._id && filter._id.$in) {
          return filter._id.$in.map(id => api._docs.get(`id:${String(id)}`)).filter(Boolean);
        }
        return [];
      })
    }))
  };
  return api;
}

function mkClient(usersColl) {
  return {
    db: () => ({
      collection: (name) => (name === 'users' ? usersColl : {})
    })
  };
}

function buildApp(usersColl) {
  const app = express();
  app.use(express.json());
  const friends = require('../friends');
  const client = mkClient(usersColl);
  friends.setApp(app, client);
  return app;
}

let usersColl, app;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
  usersColl = mkUsersColl();
  app = buildApp(usersColl);
});

describe('friends.js', () => {
  describe('POST /api/addfriend', () => {
    it('returns 400 if missing fields', async () => {
      requireAuth.mockImplementationOnce((req, res, next) => { req.userId = null; next(); });
      const res = await request(app).post('/api/addfriend').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Missing userId or friendEmail field.' });
    });
    it('returns 400 if user or friend not found', async () => {
      const res = await request(app).post('/api/addfriend').send({ friendEmail: 'f@example.com' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'User not found' });
    });
    it('returns 403 if friend not verified or not connected', async () => {
      usersColl._docs.set('id:64a000000000000000000001', { _id: new ObjectId('64a000000000000000000001') });
      usersColl._docs.set('email:f@example.com', { _id: new ObjectId('64a000000000000000000002'), email: 'f@example.com', isVerified: false, google: {} });
      const res = await request(app).post('/api/addfriend').send({ friendEmail: 'f@example.com' });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Cannot add this friend - user not verified or connected with Google.' });
    });
    it('returns 200 and updates both users on success', async () => {
      usersColl._docs.set('id:64a000000000000000000001', { _id: new ObjectId('64a000000000000000000001') });
      usersColl._docs.set('email:f@example.com', { _id: new ObjectId('64a000000000000000000002'), email: 'f@example.com', isVerified: true, google: { connected: true } });
      const res = await request(app).post('/api/addfriend').send({ friendEmail: 'f@example.com' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Friend added successfully' });
      expect(usersColl.updateOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST /api/removefriend', () => {
    it('returns 400 if missing fields', async () => {
      requireAuth.mockImplementationOnce((req, res, next) => { req.userId = null; next(); });
      const res = await request(app).post('/api/removefriend').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Missing userId or friendId field.' });
    });
    it('returns 400 if user or friend not found', async () => {
      const res = await request(app).post('/api/removefriend').send({ friendEmail: 'f@example.com' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'User not found' });
    });
    it('returns 200 and updates both users on success', async () => {
      usersColl._docs.set('id:64a000000000000000000001', { _id: new ObjectId('64a000000000000000000001') });
      usersColl._docs.set('email:f@example.com', { _id: new ObjectId('64a000000000000000000002'), email: 'f@example.com' });
      const res = await request(app).post('/api/removefriend').send({ friendEmail: 'f@example.com' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Friend removed successfully' });
      expect(usersColl.updateOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('GET /api/getfriends', () => {
    it('returns 400 if userId not found', async () => {
  requireAuth.mockImplementationOnce((req, res, next) => { req.userId = null; next(); });
  const res = await request(app).get('/api/getfriends');
  expect(res.status).toBe(404);
  expect(res.body).toEqual({ error: 'User not found' });
    });
    it('returns 404 if user not found', async () => {
      const res = await request(app).get('/api/getfriends');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'User not found' });
    });
    it('returns empty array if no friends', async () => {
      usersColl._docs.set('id:64a000000000000000000001', { _id: new ObjectId('64a000000000000000000001'), friends: [] });
      const res = await request(app).get('/api/getfriends');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ friends: [] });
    });
    it('returns friends list if friends exist', async () => {
  const friendId = new ObjectId('64a000000000000000000002');
  usersColl._docs.set('id:64a000000000000000000001', { _id: new ObjectId('64a000000000000000000001'), friends: [friendId] });
  usersColl._docs.set('id:64a000000000000000000002', { _id: friendId, email: 'f@example.com' });
  const res = await request(app).get('/api/getfriends');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ friends: [{ _id: friendId.toString(), email: 'f@example.com' }] });
    });
  });
});
