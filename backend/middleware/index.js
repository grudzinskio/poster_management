// middleware/index.js
// Export all middleware functions

const { authenticateToken, authorizeRole } = require('./auth');

module.exports = {
  authenticateToken,
  authorizeRole
};
