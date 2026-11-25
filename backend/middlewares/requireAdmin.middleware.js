const verifyJWT = require('./auth.middlewares');

// Logged in (verifyJWT sets req.user from the token) AND role === "admin".
// Identity comes from the verified token only, never from an id in the request.
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

module.exports = [verifyJWT, adminOnly];
