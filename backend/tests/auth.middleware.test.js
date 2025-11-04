jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
const { verify } = require('jsonwebtoken');
const { requireAuth } = require('../auth.middleware');

function mkReqRes(authHeader) {
  const req = { headers: authHeader ? { authorization: authHeader } : {}, body: {}, query: {} };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  return { req, res, next };
}

test('401 when no token', () => {
  const { req, res, next } = mkReqRes();
  requireAuth(req, res, next);
  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ error: 'no_token' });
  expect(next).not.toHaveBeenCalled();
});

test('accepts Bearer token and sets req.userId', () => {
  const { req, res, next } = mkReqRes('Bearer abc.def.ghi');
  verify.mockReturnValue({ userId: 'u123', firstName: 'A', lastName: 'B' });
  requireAuth(req, res, next);
  expect(req.userId).toBe('u123');
  expect(req.jwtPayload).toEqual({ userId: 'u123', firstName: 'A', lastName: 'B' });
  expect(next).toHaveBeenCalled();
});

test('401 when payload missing userId', () => {
  const { req, res } = mkReqRes('Bearer token');
  verify.mockReturnValue({ foo: 'bar' });
  requireAuth(req, res, () => {});
  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ error: 'bad_token' });
});

test('401 on verify error', () => {
  const { req, res } = mkReqRes('Bearer token');
  verify.mockImplementation(() => { throw new Error('boom'); });
  requireAuth(req, res, () => {});
  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ error: 'invalid_or_expired_token' });
});
