const jwt = require('jsonwebtoken');

function getSessionPayload(req) {
  const authHeader = String(req.headers.authorization || '');
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const payload = jwt.verify(token, secret);
    if (!payload || payload.scope !== 'session') {
      return null;
    }
    return payload;
  } catch (_error) {
    return null;
  }
}

function requireSession(req, res, next) {
  const payload = getSessionPayload(req);
  if (!payload || !payload.userId) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  req.sessionUser = payload;
  return next();
}

module.exports = {
  getSessionPayload,
  requireSession
};
