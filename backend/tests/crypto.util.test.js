describe('crypto.util enc/dec', () => {
  afterEach(() => { jest.resetModules(); });

  test('roundtrip with secret (v1)', () => {
    process.env.CRED_ENC_SECRET = 'has-secret';
    const { enc, dec } = require('../crypto.util');
    const out = enc('hello');
    expect(out.v).toBe('v1');
    expect(dec(out)).toBe('hello');
  });

  test('v0 passthrough when no secret', () => {
    delete process.env.CRED_ENC_SECRET;
    const { enc, dec } = require('../crypto.util');
    const out = enc('x');
    expect(out.v).toBe('v0');
    expect(dec(out)).toBe('x');
  });

  test('invalid payload returns null', () => {
    process.env.CRED_ENC_SECRET = 'has-secret';
    const { dec } = require('../crypto.util');
    expect(dec(null)).toBeNull();
    expect(dec({ v: 'unknown' })).toBeNull();
  });
});
