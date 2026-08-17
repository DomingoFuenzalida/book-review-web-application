const { User } = require('../models');

// Simulates session/token auth via request header 'x-user-id'
async function authenticate(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (userId) {
    req.user = await User.findByPk(userId);
  }
  next();
}

// Enforces login
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'You must be logged in to perform this action.' });
  }
  next();
}

// Enforces Admin role
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
}

module.exports = { authenticate, requireAuth, requireAdmin };