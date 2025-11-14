jest.mock('../auth.middleware', () => ({
  requireAuth: (req, _res, next) => { req.userId = '507f1f77bcf86cd799439011'; next(); }
}));

const express = require('express');
const request = require('supertest');
const { ObjectId } = require('mongodb');
const me = require('../me');

function fakeClientWithUser(userDoc) {
  return {
    db: () => ({
      collection: () => ({
        findOne: jest.fn(async (filter, opts) => {
          expect(filter).toEqual({ _id: new ObjectId('507f1f77bcf86cd799439011') });
          expect(opts.projection).toBeDefined();
          return userDoc;
        })
      })
    })
  };
}

test('GET /api/me returns user projection', async () => {
  const userDoc = {
    _id: new ObjectId('507f1f77bcf86cd799439011'),
    firstName: 'Alice',
    lastName: 'Lee',
    email: 'a@x.com',
    isVerified: true,
    google: { connected: true, accountId: 'g123' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-01')
  };

  const app = express();
  const client = fakeClientWithUser(userDoc);
  me.setApp(app, client);

  const res = await request(app).get('/api/me');
  expect(res.status).toBe(200);
  expect(res.body.user.email).toBe('a@x.com');
  expect(res.body.user.google.connected).toBe(true);
});

test('GET /api/me 404 when user missing', async () => {
  const app = express();
  const client = fakeClientWithUser(null);
  me.setApp(app, client);

  const res = await request(app).get('/api/me');
  expect(res.status).toBe(404);
  expect(res.body).toEqual({ error: 'user_not_found' });
});
