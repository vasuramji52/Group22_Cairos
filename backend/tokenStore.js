// tokenStore.js
const crypto = require('crypto');
const { ObjectId } = require('mongodb');

function randomTokenHex(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex'); // raw token sent to user
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// call this once on startup to make sure indexes exist
async function ensureIndexes(db) {
  const coll = db.collection('tokens');

  await coll.createIndex({ userId: 1, type: 1 }, { unique: true });
  await coll.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

// create or replace a verify token for this user
async function issueToken(db, { userId, type = 'verify', minutes = 15 }) {
  const raw = randomTokenHex(24);
  const tokenHash = sha256(raw);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + minutes * 60 * 1000);

  await db.collection('tokens').updateOne(
    { userId: new ObjectId(userId), type },
    {
      $set: {
        userId: new ObjectId(userId),
        type,
        tokenHash,
        expiresAt,
        usedAt: null,
        createdAt: now,
        updatedAt: now
      }
    },
    { upsert: true }
  );

  //return the RAW token so we can email it in a link
  return { raw, expiresAt };
}

  async function validateToken(db, { userId, type = 'reset', raw }) {
  const tokenHash = sha256(raw);
  const doc = await db.collection('tokens').findOne({
    userId: new ObjectId(userId),
    type
  });
  if (!doc) return { ok: false, error: 'no_token' };
  if (doc.usedAt) return { ok: false, error: 'already_used' };
  if (new Date() > new Date(doc.expiresAt)) return { ok: false, error: 'expired' };
  if (doc.tokenHash !== tokenHash) return { ok: false, error: 'mismatch' };
  return { ok: true };
}

// check and consume the token
async function consumeToken(db, { userId, type = 'verify', raw }) {
  const tokenHash = sha256(raw);

  const doc = await db.collection('tokens').findOne({
    userId: new ObjectId(userId),
    type
  });

  if (!doc) return { ok: false, error: 'no_token' };
  if (doc.usedAt) return { ok: false, error: 'already_used' };
  if (new Date() > new Date(doc.expiresAt)) return { ok: false, error: 'expired' };
  if (doc.tokenHash !== tokenHash) return { ok: false, error: 'mismatch' };

  await db.collection('tokens').updateOne(
    { _id: doc._id },
    { $set: { usedAt: new Date(), updatedAt: new Date() } }
  );

  return { ok: true };
}

module.exports = {
  ensureIndexes,
  issueToken,
  consumeToken,
  validateToken
};
