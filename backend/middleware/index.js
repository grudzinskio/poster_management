// middleware/index.js
// Export unified middleware functions

const { 
  authenticateToken, 
  requirePermission, 
  requireRole, 
  requireAnyPermission 
} = require('./unified-auth');

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  requireAnyPermission
};
