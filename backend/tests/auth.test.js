// // backend/tests/auth.test.js
// const express = require('express');
// const request = require('supertest');
// const { ObjectId } = require('mongodb');

// // --- Mocks that must be declared before requiring ../auth ---
// jest.mock('bcryptjs', () => ({
//   hash: jest.fn(async (pw) => `hashed(${pw})`),
//   compare: jest.fn(async (pw, hash) => hash === `hashed(${pw})`),
// }));

// jest.mock('../createJWT.js', () => ({
//   createToken: jest.fn((fn, ln, id) => ({
//     accessToken: `signed(${fn}.${ln}.${id})`,
//   })),
// }));

// // Prevent real email + token work during tests
// jest.mock('../mail', () => ({
//   sendMail: jest.fn(async () => {
//     // no-op to avoid hitting SendGrid and to silence warnings
//     return;
//   }),
// }));

// jest.mock('../tokenStore', () => ({
//   issueToken: jest.fn(async () => ({ raw: 'test-token-123' })),
//   consumeToken: jest.fn(async () => ({ ok: true })), // default ok
//   validateToken: jest.fn(async () => ({ ok: true })), // default ok
// }));

// function mkUsersColl() {
//   const api = {
//     _docs: new Map(),
//     findOne: jest.fn(async (filter) => {
//       if (filter.email) return api._docs.get(`email:${filter.email}`) || null;
//       if (filter._id) return api._docs.get(`id:${String(filter._id)}`) || null;
//       return null;
//     }),
//     insertOne: jest.fn(async (doc) => {
//       const _id = new ObjectId('64a000000000000000000001');
//       const stored = { ...doc, _id };
//       api._docs.set(`id:${String(_id)}`, stored);
//       api._docs.set(`email:${doc.email}`, stored);
//       return { insertedId: _id, acknowledged: true };
//     }),
//     // updateOne is used by auth.js for user updates; harmless impl:
//     updateOne: jest.fn(async (filter, update) => {
//       const key = `id:${String(filter._id)}`;
//       const existing = api._docs.get(key);
//       if (!existing) {
//         return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
//       }
//       const next = { ...existing, ...(update.$set || {}) };
//       api._docs.set(key, next);
//       api._docs.set(`email:${next.email}`, next);
//       return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
//     }),
//   };
//   return api;
// }

// function mkClient(usersColl) {
//   return {
//     db: () => ({
//       collection: (name) =>
//         name === 'users'
//           ? usersColl
//           : {
//               // If auth.js ever touches other collections in tests, keep them harmless:
//               findOne: jest.fn(async () => null),
//               insertOne: jest.fn(async () => ({
//                 insertedId: new ObjectId(),
//               })),
//               updateOne: jest.fn(async () => ({
//                 acknowledged: true,
//                 matchedCount: 1,
//                 modifiedCount: 1,
//               })),
//             },
//     }),
//   };
// }

// function buildApp(usersColl) {
//   const app = express();
//   app.use(express.json());
//   // Make sure env resembles local dev while tests run:
//   process.env.NODE_ENV = 'test';
//   process.env.FRONTEND_BASE_URL =
//     process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
//   process.env.BACKEND_BASE_URL =
//     process.env.BACKEND_BASE_URL || 'http://localhost:5000/api';

//   const auth = require('../auth');
//   const client = mkClient(usersColl);
//   auth.setApp(app, client);
//   return app;
// }

// let bcrypt, jwtLib, tokenStore, mail, usersColl, app;

// beforeEach(() => {
//   jest.resetModules();
//   jest.clearAllMocks();

//   // re-require mocks after reset
//   bcrypt = require('bcryptjs');
//   jwtLib = require('../createJWT.js');
//   tokenStore = require('../tokenStore');
//   mail = require('../mail');

//   usersColl = mkUsersColl();
//   app = buildApp(usersColl);
// });

// describe('auth.js', () => {
//   //
//   // Basic health check
//   //
//   describe('GET /api/ping', () => {
//     it('returns ok: true', async () => {
//       const res = await request(app).get('/api/ping');
//       expect(res.status).toBe(200);
//       expect(res.body).toEqual({ ok: true });
//     });
//   });

//   //
//   // REGISTER
//   //
//   describe('POST /api/register', () => {
//     it('returns 400 if missing fields', async () => {
//       const res = await request(app).post('/api/register').send({});
//       expect(res.status).toBe(400);
//       expect(res.body).toEqual({ error: 'missing_fields' });
//     });

//     it('returns 409 if user exists', async () => {
//       usersColl._docs.set('email:alice@example.com', {
//         _id: new ObjectId('64a000000000000000000002'),
//         email: 'alice@example.com',
//       });
//       const res = await request(app).post('/api/register').send({
//         firstName: 'Alice',
//         lastName: 'Lee',
//         email: 'Alice@Example.com',
//         password: 'secret123',
//       });
//       expect(res.status).toBe(409);
//       expect(res.body).toEqual({ error: 'User already exists' });
//     });

//     it('returns 200 and verification message on success (web)', async () => {
//       const res = await request(app).post('/api/register').send({
//         firstName: 'Bob',
//         lastName: 'Ray',
//         email: 'bob@example.com',
//         password: 'secret123',
//       });
//       expect(res.status).toBe(200);
//       expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
//       expect(mail.sendMail).toHaveBeenCalledTimes(1);
//       const call = mail.sendMail.mock.calls[0][0];
//       expect(call.to).toBe('bob@example.com');
//       expect(call.html).toContain('Click here to verify your email');
//       expect(call.html).toContain('/verify-email-link?');
//       expect(res.body).toEqual({
//         ok: true,
//         message: 'Registered. Check your email to verify.',
//       });
//     });

//     it('supports flutter platform for verification link', async () => {
//       // use explicit deep link base to make assertion deterministic
//       process.env.MOBILE_VERIFY_DEEP_LINK = 'cairosapp://verified-test';

//       const res = await request(app)
//         .post('/api/register')
//         .set('x-platform', 'flutter')
//         .send({
//           firstName: 'Flo',
//           lastName: 'Utter',
//           email: 'flo@example.com',
//           password: 'secret123',
//         });

//       expect(res.status).toBe(200);
//       expect(mail.sendMail).toHaveBeenCalledTimes(1);
//       const call = mail.sendMail.mock.calls[0][0];
//       // still goes via backend verify-email-link, but includes platform=flutter
//       expect(call.html).toContain('platform=flutter');
//       expect(call.html).toContain('/verify-email-link?');
//     });
//   });

//   //
//   // LOGIN
//   //
//   describe('POST /api/login', () => {
//     it('returns 400 if missing fields', async () => {
//       const res = await request(app).post('/api/login').send({});
//       expect(res.status).toBe(400);
//       expect(res.body).toEqual({ error: 'missing_fields' });
//     });

//     it('returns 401 if user not found (message from auth.js)', async () => {
//       const res = await request(app)
//         .post('/api/login')
//         .send({ email: 'x@y.com', password: 'p' });
//       expect(res.status).toBe(401);
//       expect(res.body).toEqual({ error: 'Invalid email' });
//     });

//     it('returns 401 if password is wrong (for verified user)', async () => {
//       usersColl._docs.set('email:jane@example.com', {
//         _id: new ObjectId('64a000000000000000000003'),
//         email: 'jane@example.com',
//         passwordHash: 'hashed(correct)',
//         isVerified: true,
//       });
//       const res = await request(app)
//         .post('/api/login')
//         .send({ email: 'jane@example.com', password: 'wrong' });
//       expect(res.status).toBe(401);
//       expect(res.body).toEqual({ error: 'Invalid password' });
//     });

//     it('returns 401 if user exists but not verified', async () => {
//       usersColl._docs.set('email:nov@example.com', {
//         _id: new ObjectId('64a000000000000000000099'),
//         email: 'nov@example.com',
//         passwordHash: 'hashed(secret123)',
//         isVerified: false,
//       });
//       const res = await request(app)
//         .post('/api/login')
//         .send({ email: 'nov@example.com', password: 'secret123' });
//       expect(res.status).toBe(401);
//       expect(res.body).toEqual({ error: 'User email not verified' });
//     });

//     it('returns 200 and token on success (verified user)', async () => {
//       const id = new ObjectId('64a000000000000000000004');
//       usersColl._docs.set('email:sue@example.com', {
//         _id: id,
//         firstName: 'Sue',
//         lastName: 'Q',
//         email: 'sue@example.com',
//         passwordHash: 'hashed(secret123)',
//         isVerified: true,
//       });
//       const res = await request(app)
//         .post('/api/login')
//         .send({ email: 'sue@example.com', password: 'secret123' });
//       expect(res.status).toBe(200);
//       expect(jwtLib.createToken).toHaveBeenCalledWith(
//         'Sue',
//         'Q',
//         expect.any(ObjectId),
//       );
//       expect(res.body).toEqual({ accessToken: `signed(Sue.Q.${id})` });
//     });
//   });

//   //
//   // VERIFY EMAIL LINK
//   //
//   describe('GET /api/verify-email-link', () => {
//     it('returns 400 if missing uid or token', async () => {
//       const res = await request(app)
//         .get('/api/verify-email-link')
//         .query({ uid: '64a000000000000000000010' }); // no token
//       expect(res.status).toBe(400);
//       expect(res.text).toContain('Missing uid or token');
//     });

//     it('returns 404 if user not found', async () => {
//       const res = await request(app)
//         .get('/api/verify-email-link')
//         .query({
//           uid: '64a000000000000000000011',
//           token: 'test-token-123',
//         });
//       expect(res.status).toBe(404);
//       expect(res.text).toContain('User not found');
//     });

//     it('redirects immediately if already verified', async () => {
//       const uid = '64a000000000000000000012';
//       usersColl._docs.set(`id:${uid}`, {
//         _id: new ObjectId(uid),
//         email: 'already@verified.com',
//         isVerified: true,
//       });

//       const res = await request(app)
//         .get('/api/verify-email-link')
//         .query({ uid, token: 'test-token-123' });

//       expect(res.status).toBe(302);
//       const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
//       expect(res.headers.location).toBe(`${base}?verified=1`);
//     });

//     it('returns 400 if consumeToken fails', async () => {
//       const uid = '64a000000000000000000013';
//       usersColl._docs.set(`id:${uid}`, {
//         _id: new ObjectId(uid),
//         email: 'fail@token.com',
//         isVerified: false,
//       });

//       tokenStore.consumeToken.mockResolvedValueOnce({ ok: false });

//       const res = await request(app)
//         .get('/api/verify-email-link')
//         .query({ uid, token: 'bad-token' });

//       expect(res.status).toBe(400);
//       expect(res.text).toContain('Verification failed or expired.');
//     });

//     it('verifies user and redirects for web platform', async () => {
//       const uid = '64a000000000000000000014';
//       usersColl._docs.set(`id:${uid}`, {
//         _id: new ObjectId(uid),
//         email: 'verify@web.com',
//         isVerified: false,
//       });

//       const res = await request(app)
//         .get('/api/verify-email-link')
//         .query({ uid, token: 'test-token-123' });

//       expect(res.status).toBe(302);
//       const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
//       expect(res.headers.location).toBe(`${base}?verified=1`);

//       const updated = usersColl._docs.get(`id:${uid}`);
//       expect(updated.isVerified).toBe(true);
//     });

//     it('verifies user and redirects for flutter platform', async () => {
//       const uid = '64a000000000000000000015';
//       usersColl._docs.set(`id:${uid}`, {
//         _id: new ObjectId(uid),
//         email: 'verify@flutter.com',
//         isVerified: false,
//       });

//       process.env.MOBILE_VERIFY_DEEP_LINK = 'cairosapp://verified-flutter';

//       const res = await request(app)
//         .get('/api/verify-email-link')
//         .query({
//           uid,
//           token: 'test-token-123',
//           platform: 'flutter',
//         });

//       expect(res.status).toBe(302);
//       expect(res.headers.location).toBe(
//         `cairosapp://verified-flutter?verified=1`,
//       );

//       const updated = usersColl._docs.get(`id:${uid}`);
//       expect(updated.isVerified).toBe(true);
//     });
//   });

//   //
//   // REQUEST PASSWORD RESET
//   //
//   describe('POST /api/request-password-reset', () => {
//     it('returns 400 when email missing', async () => {
//       const res = await request(app).post('/api/request-password-reset').send({});
//       expect(res.status).toBe(400);
//       expect(res.body).toEqual({ error: 'missing_email' });
//     });

//     it('returns 200 even if user does not exist (no leakage)', async () => {
//       const res = await request(app)
//         .post('/api/request-password-reset')
//         .send({ email: 'missing@example.com' });
//       expect(res.status).toBe(200);
//       expect(res.body.ok).toBe(true);
//     });

//     it('sends reset email for existing user (web)', async () => {
//       const uid = new ObjectId('64a000000000000000000020');
//       usersColl._docs.set('email:resetweb@example.com', {
//         _id: uid,
//         email: 'resetweb@example.com',
//         firstName: 'ResetWeb',
//       });

//       const res = await request(app)
//         .post('/api/request-password-reset')
//         .send({ email: 'resetweb@example.com' });

//       expect(res.status).toBe(200);
//       expect(mail.sendMail).toHaveBeenCalledTimes(1);

//       const call = mail.sendMail.mock.calls[0][0];
//       expect(call.to).toBe('resetweb@example.com');
//       expect(call.html).toContain('Reset your password');
//       expect(call.html).toContain('test-token-123');
//       expect(call.html).toContain('/reset-password-link?');
//     });

//     it('sends reset email for flutter platform', async () => {
//       const uid = new ObjectId('64a000000000000000000021');
//       usersColl._docs.set('email:resetflutter@example.com', {
//         _id: uid,
//         email: 'resetflutter@example.com',
//         firstName: 'ResetFlutter',
//       });

//       process.env.MOBILE_RESET_DEEP_LINK = 'cairosapp://reset-flutter';

//       const res = await request(app)
//         .post('/api/request-password-reset')
//         .set('x-platform', 'flutter')
//         .send({ email: 'resetflutter@example.com' });

//       expect(res.status).toBe(200);
//       expect(mail.sendMail).toHaveBeenCalledTimes(1);

//       const call = mail.sendMail.mock.calls[0][0];
//       expect(call.html).toContain('platform=flutter');
//       expect(call.html).toContain('/reset-password-link?');
//     });
//   });

//   //
//   // RESET PASSWORD LINK (GET)
//   //
//   describe('GET /api/reset-password-link', () => {
//     it('returns 400 if uid or token missing', async () => {
//       const res = await request(app)
//         .get('/api/reset-password-link')
//         .query({ uid: '64a000000000000000000030' }); // no token
//       expect(res.status).toBe(400);
//       expect(res.text).toContain('Missing uid or token');
//     });

//     it('returns 400 if token is invalid/expired', async () => {
//       tokenStore.validateToken.mockResolvedValueOnce({ ok: false });

//       const res = await request(app)
//         .get('/api/reset-password-link')
//         .query({
//           uid: '64a000000000000000000031',
//           token: 'bad-token',
//         });

//       expect(res.status).toBe(400);
//       expect(res.text).toContain('Reset link invalid or expired');
//     });

//     it('redirects to web reset page when platform is web/default', async () => {
//       const uid = '64a000000000000000000032';
//       const token = 'good-token';

//       const res = await request(app)
//         .get('/api/reset-password-link')
//         .query({ uid, token });

//       expect(res.status).toBe(302);
//       const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
//       expect(res.headers.location).toBe(
//         `${base}/reset-password?uid=${uid}&token=${token}`,
//       );
//     });

//     it('redirects to flutter deep link when platform is flutter', async () => {
//       const uid = '64a000000000000000000033';
//       const token = 'good-token-flutter';
//       process.env.MOBILE_RESET_DEEP_LINK = 'cairosapp://reset-flutter';

//       const res = await request(app)
//         .get('/api/reset-password-link')
//         .query({ uid, token, platform: 'flutter' });

//       expect(res.status).toBe(302);
//       expect(res.headers.location).toBe(
//         `cairosapp://reset-flutter?uid=${uid}&token=${token}`,
//       );
//     });
//   });

//   //
//   // CONFIRM RESET PASSWORD (POST)
//   //
//   describe('POST /api/confirm-reset-password', () => {
//     it('returns 400 if required fields missing', async () => {
//       const res = await request(app)
//         .post('/api/confirm-reset-password')
//         .send({});
//       expect(res.status).toBe(400);
//       expect(res.body).toEqual({ error: 'missing_fields' });
//     });

//     it('returns 400 if password is too weak', async () => {
//       const res = await request(app)
//         .post('/api/confirm-reset-password')
//         .send({
//           uid: '64a000000000000000000040',
//           token: 't',
//           newPassword: 'short',
//         });
//       expect(res.status).toBe(400);
//       expect(res.body).toEqual({ error: 'weak_password' });
//     });

//     it('returns 400 if token is invalid or expired', async () => {
//       tokenStore.consumeToken.mockResolvedValueOnce({ ok: false });

//       const res = await request(app)
//         .post('/api/confirm-reset-password')
//         .send({
//           uid: '64a000000000000000000041',
//           token: 'bad-token',
//           newPassword: 'strongpassword',
//         });

//       expect(res.status).toBe(400);
//       expect(res.body).toEqual({ error: 'invalid_or_expired_token' });
//     });

//     it('hashes password and updates user on success', async () => {
//       tokenStore.consumeToken.mockResolvedValueOnce({ ok: true });

//       const uid = '64a000000000000000000042';
//       // Optional: seed user so our fake updateOne merges into something
//       usersColl._docs.set(`id:${uid}`, {
//         _id: new ObjectId(uid),
//         email: 'confirm@reset.com',
//         passwordHash: 'old-hash',
//       });

//       const res = await request(app)
//         .post('/api/confirm-reset-password')
//         .send({
//           uid,
//           token: 'good-token',
//           newPassword: 'strongpassword',
//         });

//       expect(res.status).toBe(200);
//       expect(bcrypt.hash).toHaveBeenCalledWith('strongpassword', 10);
//       expect(res.body).toEqual({
//         ok: true,
//         message: 'Password updated successfully.',
//       });

//       // Confirm our fake collection was updated
//       const updated = usersColl._docs.get(`id:${uid}`);
//       expect(updated.passwordHash).toBe('hashed(strongpassword)');
//     });
//   });
// });

// backend/tests/auth.test.js
const express = require('express');
const request = require('supertest');
const { ObjectId } = require('mongodb');

// --- Mocks that must be declared before requiring ../auth ---
jest.mock('bcryptjs', () => ({
  hash: jest.fn(async (pw) => `hashed(${pw})`),
  compare: jest.fn(async (pw, hash) => hash === `hashed(${pw})`),
}));

jest.mock('../createJWT.js', () => ({
  createToken: jest.fn((fn, ln, id) => ({
    accessToken: `signed(${fn}.${ln}.${id})`,
  })),
}));

// Prevent real email + token work during tests
jest.mock('../mail', () => ({
  sendMail: jest.fn(async () => {
    // no-op to avoid hitting SendGrid and to silence warnings
    return;
  }),
}));

jest.mock('../tokenStore', () => ({
  issueToken: jest.fn(async () => ({ raw: 'test-token-123' })),
  consumeToken: jest.fn(async () => ({ ok: true })), // default ok
  validateToken: jest.fn(async () => ({ ok: true })), // default ok
}));

function mkUsersColl() {
  const api = {
    _docs: new Map(),
    findOne: jest.fn(async (filter) => {
      if (filter.email) return api._docs.get(`email:${filter.email}`) || null;
      if (filter._id) return api._docs.get(`id:${String(filter._id)}`) || null;
      return null;
    }),
    insertOne: jest.fn(async (doc) => {
      const _id = new ObjectId('64a000000000000000000001');
      const stored = { ...doc, _id };
      api._docs.set(`id:${String(_id)}`, stored);
      api._docs.set(`email:${doc.email}`, stored);
      return { insertedId: _id, acknowledged: true };
    }),
    // updateOne is used by auth.js for user updates; harmless impl:
    updateOne: jest.fn(async (filter, update) => {
      const key = `id:${String(filter._id)}`;
      const existing = api._docs.get(key);
      if (!existing) {
        return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
      }
      const next = { ...existing, ...(update.$set || {}) };
      api._docs.set(key, next);
      api._docs.set(`email:${next.email}`, next);
      return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
    }),
  };
  return api;
}

function mkClient(usersColl) {
  return {
    db: () => ({
      collection: (name) =>
        name === 'users'
          ? usersColl
          : {
              // If auth.js ever touches other collections in tests, keep them harmless:
              findOne: jest.fn(async () => null),
              insertOne: jest.fn(async () => ({
                insertedId: new ObjectId(),
              })),
              updateOne: jest.fn(async () => ({
                acknowledged: true,
                matchedCount: 1,
                modifiedCount: 1,
              })),
            },
    }),
  };
}

function buildApp(usersColl) {
  const app = express();
  app.use(express.json());
  // Make sure env resembles local dev while tests run:
  process.env.NODE_ENV = 'test';
  process.env.FRONTEND_BASE_URL =
    process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  process.env.BACKEND_BASE_URL =
    process.env.BACKEND_BASE_URL || 'http://localhost:5000/api';

  const auth = require('../auth');
  const client = mkClient(usersColl);
  auth.setApp(app, client);
  return app;
}

let bcrypt, jwtLib, tokenStore, mail, usersColl, app;

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();

  // re-require mocks after reset
  bcrypt = require('bcryptjs');
  jwtLib = require('../createJWT.js');
  tokenStore = require('../tokenStore');
  mail = require('../mail');

  usersColl = mkUsersColl();
  app = buildApp(usersColl);
});

describe('auth.js', () => {
  //
  // Basic health check
  //
  describe('GET /api/ping', () => {
    it('returns ok: true', async () => {
      const res = await request(app).get('/api/ping');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });

  //
  // REGISTER
  //
  describe('POST /api/register', () => {
    it('returns 400 if missing fields', async () => {
      const res = await request(app).post('/api/register').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'missing_fields' });
    });

    it('returns 409 if user exists', async () => {
      usersColl._docs.set('email:alice@example.com', {
        _id: new ObjectId('64a000000000000000000002'),
        email: 'alice@example.com',
      });
      const res = await request(app).post('/api/register').send({
        firstName: 'Alice',
        lastName: 'Lee',
        email: 'Alice@Example.com',
        password: 'secret123',
      });
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: 'User already exists' });
    });

    it('returns 200 and verification message on success (web)', async () => {
      const res = await request(app).post('/api/register').send({
        firstName: 'Bob',
        lastName: 'Ray',
        email: 'bob@example.com',
        password: 'secret123',
      });
      expect(res.status).toBe(200);
      expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
      expect(mail.sendMail).toHaveBeenCalledTimes(1);
      const call = mail.sendMail.mock.calls[0][0];
      expect(call.to).toBe('bob@example.com');
      expect(call.html).toContain('Click here to verify your email');
      expect(call.html).toContain('/verify-email-link?');
      expect(res.body).toEqual({
        ok: true,
        message: 'Registered. Check your email to verify.',
      });
    });

    it('supports flutter platform for verification link', async () => {
      // use explicit deep link base to make assertion deterministic
      process.env.MOBILE_VERIFY_DEEP_LINK = 'cairosapp://verified-test';

      const res = await request(app)
        .post('/api/register')
        .set('x-platform', 'flutter')
        .send({
          firstName: 'Flo',
          lastName: 'Utter',
          email: 'flo@example.com',
          password: 'secret123',
        });

      expect(res.status).toBe(200);
      expect(mail.sendMail).toHaveBeenCalledTimes(1);
      const call = mail.sendMail.mock.calls[0][0];
      // still goes via backend verify-email-link, but includes platform=flutter
      expect(call.html).toContain('platform=flutter');
      expect(call.html).toContain('/verify-email-link?');
    });

    // NEW: cover register catch (lines 99–100)
    it('returns 500 if unexpected error occurs during register', async () => {
      usersColl.insertOne.mockImplementationOnce(() => {
        throw new Error('register failure');
      });

      const res = await request(app).post('/api/register').send({
        firstName: 'Err',
        lastName: 'User',
        email: 'err@example.com',
        password: 'secret123',
      });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('register failure');
    });
  });

  //
  // LOGIN
  //
  describe('POST /api/login', () => {
    it('returns 400 if missing fields', async () => {
      const res = await request(app).post('/api/login').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'missing_fields' });
    });

    it('returns 401 if user not found (message from auth.js)', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'x@y.com', password: 'p' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid email' });
    });

    it('returns 401 if password is wrong (for verified user)', async () => {
      usersColl._docs.set('email:jane@example.com', {
        _id: new ObjectId('64a000000000000000000003'),
        email: 'jane@example.com',
        passwordHash: 'hashed(correct)',
        isVerified: true,
      });
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'jane@example.com', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Invalid password' });
    });

    it('returns 401 if user exists but not verified', async () => {
      usersColl._docs.set('email:nov@example.com', {
        _id: new ObjectId('64a000000000000000000099'),
        email: 'nov@example.com',
        passwordHash: 'hashed(secret123)',
        isVerified: false,
      });
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'nov@example.com', password: 'secret123' });
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
        isVerified: true,
      });
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'sue@example.com', password: 'secret123' });
      expect(res.status).toBe(200);
      expect(jwtLib.createToken).toHaveBeenCalledWith(
        'Sue',
        'Q',
        expect.any(ObjectId),
      );
      expect(res.body).toEqual({ accessToken: `signed(Sue.Q.${id})` });
    });

    // NEW: cover login catch (lines 185–186)
    it('returns 500 if unexpected error occurs during login', async () => {
      usersColl.findOne.mockImplementationOnce(() => {
        throw new Error('login failure');
      });

      const res = await request(app)
        .post('/api/login')
        .send({ email: 'err@login.com', password: 'secret123' });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('login failure');
    });
  });

  //
  // VERIFY EMAIL LINK
  //
  describe('GET /api/verify-email-link', () => {
    it('returns 400 if missing uid or token', async () => {
      const res = await request(app)
        .get('/api/verify-email-link')
        .query({ uid: '64a000000000000000000010' }); // no token
      expect(res.status).toBe(400);
      expect(res.text).toContain('Missing uid or token');
    });

    it('returns 404 if user not found', async () => {
      const res = await request(app)
        .get('/api/verify-email-link')
        .query({
          uid: '64a000000000000000000011',
          token: 'test-token-123',
        });
      expect(res.status).toBe(404);
      expect(res.text).toContain('User not found');
    });

    it('redirects immediately if already verified', async () => {
      const uid = '64a000000000000000000012';
      usersColl._docs.set(`id:${uid}`, {
        _id: new ObjectId(uid),
        email: 'already@verified.com',
        isVerified: true,
      });

      const res = await request(app)
        .get('/api/verify-email-link')
        .query({ uid, token: 'test-token-123' });

      expect(res.status).toBe(302);
      const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
      expect(res.headers.location).toBe(`${base}?verified=1`);
    });

    it('returns 400 if consumeToken fails', async () => {
      const uid = '64a000000000000000000013';
      usersColl._docs.set(`id:${uid}`, {
        _id: new ObjectId(uid),
        email: 'fail@token.com',
        isVerified: false,
      });

      tokenStore.consumeToken.mockResolvedValueOnce({ ok: false });

      const res = await request(app)
        .get('/api/verify-email-link')
        .query({ uid, token: 'bad-token' });

      expect(res.status).toBe(400);
      expect(res.text).toContain('Verification failed or expired.');
    });

    it('verifies user and redirects for web platform', async () => {
      const uid = '64a000000000000000000014';
      usersColl._docs.set(`id:${uid}`, {
        _id: new ObjectId(uid),
        email: 'verify@web.com',
        isVerified: false,
      });

      const res = await request(app)
        .get('/api/verify-email-link')
        .query({ uid, token: 'test-token-123' });

      expect(res.status).toBe(302);
      const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
      expect(res.headers.location).toBe(`${base}?verified=1`);

      const updated = usersColl._docs.get(`id:${uid}`);
      expect(updated.isVerified).toBe(true);
    });

    it('verifies user and redirects for flutter platform', async () => {
      const uid = '64a000000000000000000015';
      usersColl._docs.set(`id:${uid}`, {
        _id: new ObjectId(uid),
        email: 'verify@flutter.com',
        isVerified: false,
      });

      process.env.MOBILE_VERIFY_DEEP_LINK = 'cairosapp://verified-flutter';

      const res = await request(app)
        .get('/api/verify-email-link')
        .query({
          uid,
          token: 'test-token-123',
          platform: 'flutter',
        });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(
        `cairosapp://verified-flutter?verified=1`,
      );

      const updated = usersColl._docs.get(`id:${uid}`);
      expect(updated.isVerified).toBe(true);
    });

    // NEW: cover verify catch (lines 149–150)
    it('returns 500 if unexpected error occurs during verify-email-link', async () => {
      usersColl.findOne.mockImplementationOnce(() => {
        throw new Error('verify failure');
      });

      const res = await request(app)
        .get('/api/verify-email-link')
        .query({
          uid: '64a000000000000000000099',
          token: 'test-token-123',
        });

      expect(res.status).toBe(500);
      expect(res.text).toContain('Server error');
    });
  });

  //
  // REQUEST PASSWORD RESET
  //
  describe('POST /api/request-password-reset', () => {
    it('returns 400 when email missing', async () => {
      const res = await request(app).post('/api/request-password-reset').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'missing_email' });
    });

    it('returns 200 even if user does not exist (no leakage)', async () => {
      const res = await request(app)
        .post('/api/request-password-reset')
        .send({ email: 'missing@example.com' });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('sends reset email for existing user (web)', async () => {
      const uid = new ObjectId('64a000000000000000000020');
      usersColl._docs.set('email:resetweb@example.com', {
        _id: uid,
        email: 'resetweb@example.com',
        firstName: 'ResetWeb',
      });

      const res = await request(app)
        .post('/api/request-password-reset')
        .send({ email: 'resetweb@example.com' });

      expect(res.status).toBe(200);
      expect(mail.sendMail).toHaveBeenCalledTimes(1);

      const call = mail.sendMail.mock.calls[0][0];
      expect(call.to).toBe('resetweb@example.com');
      expect(call.html).toContain('Reset your password');
      expect(call.html).toContain('test-token-123');
      expect(call.html).toContain('/reset-password-link?');
    });

    it('sends reset email for flutter platform', async () => {
      const uid = new ObjectId('64a000000000000000000021');
      usersColl._docs.set('email:resetflutter@example.com', {
        _id: uid,
        email: 'resetflutter@example.com',
        firstName: 'ResetFlutter',
      });

      process.env.MOBILE_RESET_DEEP_LINK = 'cairosapp://reset-flutter';

      const res = await request(app)
        .post('/api/request-password-reset')
        .set('x-platform', 'flutter')
        .send({ email: 'resetflutter@example.com' });

      expect(res.status).toBe(200);
      expect(mail.sendMail).toHaveBeenCalledTimes(1);

      const call = mail.sendMail.mock.calls[0][0];
      expect(call.html).toContain('platform=flutter');
      expect(call.html).toContain('/reset-password-link?');
    });

    // NEW: cover request-reset catch (lines 228–229)
    it('returns 500 if unexpected error occurs during request-password-reset', async () => {
      usersColl.findOne.mockImplementationOnce(() => {
        throw new Error('request-reset failure');
      });

      const res = await request(app)
        .post('/api/request-password-reset')
        .send({ email: 'err@reset.com' });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('request-reset failure');
    });
  });

  //
  // RESET PASSWORD LINK (GET)
  //
  describe('GET /api/reset-password-link', () => {
    it('returns 400 if uid or token missing', async () => {
      const res = await request(app)
        .get('/api/reset-password-link')
        .query({ uid: '64a000000000000000000030' }); // no token
      expect(res.status).toBe(400);
      expect(res.text).toContain('Missing uid or token');
    });

    it('returns 400 if token is invalid/expired', async () => {
      tokenStore.validateToken.mockResolvedValueOnce({ ok: false });

      const res = await request(app)
        .get('/api/reset-password-link')
        .query({
          uid: '64a000000000000000000031',
          token: 'bad-token',
        });

      expect(res.status).toBe(400);
      expect(res.text).toContain('Reset link invalid or expired');
    });

    it('redirects to web reset page when platform is web/default', async () => {
      const uid = '64a000000000000000000032';
      const token = 'good-token';

      const res = await request(app)
        .get('/api/reset-password-link')
        .query({ uid, token });

      expect(res.status).toBe(302);
      const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
      expect(res.headers.location).toBe(
        `${base}/reset-password?uid=${uid}&token=${token}`,
      );
    });

    it('redirects to flutter deep link when platform is flutter', async () => {
      const uid = '64a000000000000000000033';
      const token = 'good-token-flutter';
      process.env.MOBILE_RESET_DEEP_LINK = 'cairosapp://reset-flutter';

      const res = await request(app)
        .get('/api/reset-password-link')
        .query({ uid, token, platform: 'flutter' });

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(
        `cairosapp://reset-flutter?uid=${uid}&token=${token}`,
      );
    });

    // NEW: cover reset-link catch (lines 259–260)
    it('returns 500 if unexpected error occurs during reset-password-link', async () => {
      tokenStore.validateToken.mockImplementationOnce(() => {
        throw new Error('reset-link failure');
      });

      const res = await request(app)
        .get('/api/reset-password-link')
        .query({
          uid: '64a000000000000000000050',
          token: 'token',
        });

      expect(res.status).toBe(500);
      expect(res.text).toContain('Server error');
    });
  });

  //
  // CONFIRM RESET PASSWORD (POST)
  //
  describe('POST /api/confirm-reset-password', () => {
    it('returns 400 if required fields missing', async () => {
      const res = await request(app)
        .post('/api/confirm-reset-password')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'missing_fields' });
    });

    it('returns 400 if password is too weak', async () => {
      const res = await request(app)
        .post('/api/confirm-reset-password')
        .send({
          uid: '64a000000000000000000040',
          token: 't',
          newPassword: 'short',
        });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'weak_password' });
    });

    it('returns 400 if token is invalid or expired', async () => {
      tokenStore.consumeToken.mockResolvedValueOnce({ ok: false });

      const res = await request(app)
        .post('/api/confirm-reset-password')
        .send({
          uid: '64a000000000000000000041',
          token: 'bad-token',
          newPassword: 'strongpassword',
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'invalid_or_expired_token' });
    });

    it('hashes password and updates user on success', async () => {
      tokenStore.consumeToken.mockResolvedValueOnce({ ok: true });

      const uid = '64a000000000000000000042';
      // Optional: seed user so our fake updateOne merges into something
      usersColl._docs.set(`id:${uid}`, {
        _id: new ObjectId(uid),
        email: 'confirm@reset.com',
        passwordHash: 'old-hash',
      });

      const res = await request(app)
        .post('/api/confirm-reset-password')
        .send({
          uid,
          token: 'good-token',
          newPassword: 'strongpassword',
        });

      expect(res.status).toBe(200);
      expect(bcrypt.hash).toHaveBeenCalledWith('strongpassword', 10);
      expect(res.body).toEqual({
        ok: true,
        message: 'Password updated successfully.',
      });

      // Confirm our fake collection was updated
      const updated = usersColl._docs.get(`id:${uid}`);
      expect(updated.passwordHash).toBe('hashed(strongpassword)');
    });

    // NEW: cover confirm-reset catch (lines 286–287)
    it('returns 500 if unexpected error occurs during confirm-reset-password', async () => {
      tokenStore.consumeToken.mockImplementationOnce(() => {
        throw new Error('confirm-reset failure');
      });

      const res = await request(app)
        .post('/api/confirm-reset-password')
        .send({
          uid: '64a000000000000000000060',
          token: 'token',
          newPassword: 'strongpassword',
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('confirm-reset failure');
    });
  });
});
