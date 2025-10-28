// crypto.util.js
const crypto = require('crypto');

const KEY = Buffer.from(process.env.CRED_ENC_SECRET || '', 'utf8');
if (KEY.length === 0) console.warn('⚠️ CRED_ENC_SECRET not set (google refresh token will not be encrypted)');

function enc(plain) {
  if (!KEY.length) return { v: 'v0', data: plain }; // dev fallback
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', crypto.createHash('sha256').update(KEY).digest(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { v: 'v1', data: Buffer.concat([iv, tag, enc]).toString('base64') };
}

function dec(payload) {
  if (!payload || !payload.v) return null;
  if (payload.v === 'v0') return payload.data;
  if (payload.v !== 'v1') return null;
  const buf = Buffer.from(payload.data, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', crypto.createHash('sha256').update(KEY).digest(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}

module.exports = { enc, dec };
