// backend/tests/createJWT.test.js
const jwt = require('jsonwebtoken');
jest.mock('jsonwebtoken');
const createJWT = require('../createJWT');

describe('createJWT.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ACCESS_TOKEN_SECRET = 'testsecret';
  });

  describe('createToken', () => {
    it('returns an accessToken on success', () => {
      jwt.sign.mockReturnValue('signedtoken');
      const result = createJWT.createToken('A', 'B', 'id123');
      expect(jwt.sign).toHaveBeenCalledWith({ userId: 'id123', firstName: 'A', lastName: 'B' }, 'testsecret');
      expect(result).toEqual({ accessToken: 'signedtoken' });
    });

    it('returns error if jwt.sign throws', () => {
      jwt.sign.mockImplementation(() => { throw new Error('fail'); });
      const result = createJWT.createToken('A', 'B', 'id123');
      expect(result).toEqual({ error: 'fail' });
    });
  });

  describe('isExpired', () => {
    it('returns true if token is expired', () => {
      jwt.verify.mockImplementation((token, secret, cb) => cb(new Error('expired'), null));
      const result = createJWT.isExpired('token');
      expect(result).toBe(true);
    });
    it('returns false if token is valid', () => {
      jwt.verify.mockImplementation((token, secret, cb) => cb(null, { userId: 'id123' }));
      const result = createJWT.isExpired('token');
      expect(result).toBe(false);
    });
  });

  describe('refresh', () => {
    it('calls _createToken with decoded user info', () => {
      jwt.decode.mockReturnValue({ payload: { id: 'id123', firstName: 'A', lastName: 'B' } });
      jwt.sign.mockReturnValue('signedtoken');
      const result = createJWT.refresh('token');
      expect(jwt.decode).toHaveBeenCalledWith('token', { complete: true });
      expect(result).toEqual({ accessToken: 'signedtoken' });
    });
  });
});
