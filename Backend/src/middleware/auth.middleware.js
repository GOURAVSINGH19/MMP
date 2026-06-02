import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_marathon_key_2026';

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
      }

      req.user = {
        ...user,
        role: user.role || user.platformRole
      };
      next();
    });
  } else {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User context missing' });
    }

    const roleAliases = {
      ORGANIZER: ['ORGANIZER', 'EVENT_MANAGER', 'SUPER_ADMIN'],
      EVENT_MANAGER: ['EVENT_MANAGER', 'ORGANIZER'],
    };
    const acceptedRoles = allowedRoles.flatMap((role) => roleAliases[role] || role);

    if (!acceptedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of these roles: [${allowedRoles.join(', ')}]` });
    }

    next();
  };
};
