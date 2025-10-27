// auth.middleware.js
const jwt = require('jsonwebtoken');

function getBearer(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || '';
  return (typeof h === 'string' && h.toLowerCase().startsWith('bearer '))
    ? h.slice(7).trim()
    : null;
}

module.exports.requireAuth = function requireAuth(req, res, next) {
  try {
    const token = getBearer(req) || req.body?.jwtToken || req.query?.jwtToken;
    if (!token) return res.status(401).json({ error: 'no_token' });

    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // Your createJWT payload uses userId/firstName/lastName:
    if (!payload?.userId) return res.status(401).json({ error: 'bad_token' });

    req.userId = String(payload.userId);
    req.jwtPayload = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_or_expired_token' });
  }
};
