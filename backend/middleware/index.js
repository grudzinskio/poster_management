// middleware/index.js
// Export all middleware functions

const { authenticateToken, authorizeRole, authorizePermission, authorizeAnyRole } = require('./auth');

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizePermission,
  authorizeAnyRole
};
