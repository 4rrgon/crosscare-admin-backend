import jwt from 'jsonwebtoken';


export function jwtVerifyMiddleware(secret) {
  return (req, res, next) => {
    const cookieToken = req.cookies && req.cookies.auth_token;
    const header = req.headers.authorization;
    const headerToken = header && header.startsWith('Bearer ') ? header.split(' ')[1] : null;
    const token = cookieToken || headerToken;
    if (!token) return next();

    if (!secret) {
      console.warn('JWT secret missing; skipping verification.');
      return next();
    }

    try {
      const payload = jwt.verify(token, secret);
      req.user = payload;
    } catch (err) {
      console.log('Invalid JWT:', err.message);
    }
    return next();
  };
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}
