const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // <img>/<a> tags can't set an Authorization header, so file routes accept
  // the token as a query param too.
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.query.token;
  if (!token) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

module.exports = authMiddleware;
