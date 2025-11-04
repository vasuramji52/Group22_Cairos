// backend/tests/tokenStore.test.js
const { ObjectId } = require('mongodb');

// Make randomBytes deterministic but keep real hashing
jest.mock('crypto', () => {
  const real = jest.requireActual('crypto');
  return {
    ...real,
    randomBytes: jest.fn(() => Buffer.alloc(24, 1)) // 24 bytes of 0x01 -> raw hex = '01' * 24
  };
});

const realCrypto = jest.requireActual('crypto');

function mkDB() {
  const state = { doc: null }; // per-test token doc returned by findOne
  const tokens = {
    createIndex: jest.fn(async () => ({})),
    updateOne: jest.fn(async () => ({ acknowledged: true })),
    findOne: jest.fn(async () => state.doc)
  };
  const db = { collection: (name) => (name === 'tokens' ? tokens : null) };
  return { db, tokens, state };
}

describe('tokenStore', () => {
  let tokenStore;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    tokenStore = require('../tokenStore');
  });

  test('ensureIndexes creates composite unique and TTL indexes', async () => {
    const { db, tokens } = mkDB();
    await tokenStore.ensureIndexes(db);
    expect(tokens.createIndex).toHaveBeenNthCalledWith(1, { userId: 1, type: 1 }, { unique: true });
    expect(tokens.createIndex).toHaveBeenNthCalledWith(2, { expiresAt: 1 }, { expireAfterSeconds: 0 });
  });

  test('issueToken upserts hashed token with expiry and returns raw+expiresAt', async () => {
    const { db, tokens } = mkDB();
    const userId = new ObjectId('64a000000000000000000001');

    const { raw, expiresAt } = await tokenStore.issueToken(db, { userId, type: 'verify', minutes: 15 });

    // raw should be deterministic from mocked randomBytes => 24 bytes of 0x01 = '01' * 24
    expect(raw).toBe('01'.repeat(24));
    expect(expiresAt).toBeInstanceOf(Date);

    // Check updateOne payload
    expect(tokens.updateOne).toHaveBeenCalledTimes(1);
    const [filter, update, opts] = tokens.updateOne.mock.calls[0];

    expect(filter).toEqual({ userId: new ObjectId(userId), type: 'verify' });
    expect(opts).toEqual({ upsert: true });

    const setDoc = update.$set;
    // tokenHash should be sha256(raw)
    const expectedHash = realCrypto.createHash('sha256').update(raw).digest('hex');
    expect(setDoc.tokenHash).toBe(expectedHash);
    expect(setDoc.userId).toEqual(new ObjectId(userId));
    expect(setDoc.type).toBe('verify');
    expect(setDoc.usedAt).toBeNull();
    expect(setDoc.expiresAt).toBeInstanceOf(Date);
    expect(setDoc.createdAt).toBeInstanceOf(Date);
    expect(setDoc.updatedAt).toBeInstanceOf(Date);
  });

  describe('validateToken', () => {
    const uid = new ObjectId('64a0000000000000000000aa');

    function makeDoc({ used = false, expired = false, match = true }) {
      const raw = '01'.repeat(24); // raw we will pass to validate
      const hash = realCrypto.createHash('sha256').update(raw).digest('hex');
      return {
        _id: new ObjectId('64a0000000000000000000bb'),
        userId: uid,
        type: 'reset',
        tokenHash: match ? hash : 'nottherightHash',
        expiresAt: expired ? new Date(Date.now() - 1000) : new Date(Date.now() + 60_000),
        usedAt: used ? new Date() : null
      };
    }

    test('no token doc -> {ok:false,no_token}', async () => {
      const { db } = mkDB(); // no state.doc set
      const res = await tokenStore.validateToken(db, { userId: uid, type: 'reset', raw: 'anything' });
      expect(res).toEqual({ ok: false, error: 'no_token' });
    });

    test('already used -> {ok:false,already_used}', async () => {
      const { db, state } = mkDB();
      state.doc = makeDoc({ used: true });
      const res = await tokenStore.validateToken(db, { userId: uid, type: 'reset', raw: '01'.repeat(24) });
      expect(res).toEqual({ ok: false, error: 'already_used' });
    });

    test('expired -> {ok:false,expired}', async () => {
      const { db, state } = mkDB();
      state.doc = makeDoc({ expired: true });
      const res = await tokenStore.validateToken(db, { userId: uid, type: 'reset', raw: '01'.repeat(24) });
      expect(res).toEqual({ ok: false, error: 'expired' });
    });

    test('mismatch -> {ok:false,mismatch}', async () => {
      const { db, state } = mkDB();
      state.doc = makeDoc({ match: false });
      const res = await tokenStore.validateToken(db, { userId: uid, type: 'reset', raw: '01'.repeat(24) });
      expect(res).toEqual({ ok: false, error: 'mismatch' });
    });

    test('ok -> {ok:true}', async () => {
      const { db, state } = mkDB();
      state.doc = makeDoc({});
      const res = await tokenStore.validateToken(db, { userId: uid, type: 'reset', raw: '01'.repeat(24) });
      expect(res).toEqual({ ok: true });
    });
  });

  describe('consumeToken', () => {
    const uid = new ObjectId('64a0000000000000000000cc');

    function makeDoc({ used = false, expired = false, match = true }) {
      const raw = '01'.repeat(24);
      const hash = realCrypto.createHash('sha256').update(raw).digest('hex');
      return {
        _id: new ObjectId('64a0000000000000000000dd'),
        userId: uid,
        type: 'verify',
        tokenHash: match ? hash : 'bad',
        expiresAt: expired ? new Date(Date.now() - 1000) : new Date(Date.now() + 60_000),
        usedAt: used ? new Date() : null
      };
    }

    test('no token -> {ok:false,no_token}', async () => {
      const { db } = mkDB();
      const res = await tokenStore.consumeToken(db, { userId: uid, type: 'verify', raw: '01'.repeat(24) });
      expect(res).toEqual({ ok: false, error: 'no_token' });
    });

    test('already used -> {ok:false,already_used}', async () => {
      const { db, state } = mkDB();
      state.doc = makeDoc({ used: true });
      const res = await tokenStore.consumeToken(db, { userId: uid, type: 'verify', raw: '01'.repeat(24) });
      expect(res).toEqual({ ok: false, error: 'already_used' });
    });

    test('expired -> {ok:false,expired}', async () => {
      const { db, state } = mkDB();
      state.doc = makeDoc({ expired: true });
      const res = await tokenStore.consumeToken(db, { userId: uid, type: 'verify', raw: '01'.repeat(24) });
      expect(res).toEqual({ ok: false, error: 'expired' });
    });

    test('mismatch -> {ok:false,mismatch}', async () => {
      const { db, state } = mkDB();
      state.doc = makeDoc({ match: false });
      const res = await tokenStore.consumeToken(db, { userId: uid, type: 'verify', raw: '01'.repeat(24) });
      expect(res).toEqual({ ok: false, error: 'mismatch' });
    });

    test('ok -> updates usedAt and returns {ok:true}', async () => {
      const { db, tokens, state } = mkDB();
      const doc = makeDoc({});
      state.doc = doc;

      const res = await tokenStore.consumeToken(db, { userId: uid, type: 'verify', raw: '01'.repeat(24) });
      expect(res).toEqual({ ok: true });

      expect(tokens.updateOne).toHaveBeenCalledWith(
        { _id: doc._id },
        { $set: { usedAt: expect.any(Date), updatedAt: expect.any(Date) } }
      );
    });
  });
});
