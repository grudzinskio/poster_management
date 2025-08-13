const knex = require('../config/knex');

// Middleware to check if user has specific permission
const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Make sure user is authenticated first
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          error: 'Unauthorized', 
          message: 'User not authenticated' 
        });
      }

      const userId = req.user.id;
      
      // Get user's permissions using same query as your existing code
      const permissions = await knex('user_roles as ur')
        .join('roles as r', 'ur.role', 'r.id')
        .join('role_permissions as rp', 'r.id', 'rp.role')
        .join('permissions as p', 'rp.permission', 'p.id')
        .where('ur.user', userId)
        .select('p.permission', 'p.description', 'r.name as role_name')
        .distinct();

      // Extract permission names
      const userPermissions = permissions.map(p => p.permission);

      // Check if user has required permission
      if (!userPermissions.includes(requiredPermission)) {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: `You don't have permission: ${requiredPermission}` 
        });
      }

      // User has permission, continue
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Internal server error during permission check' });
    }
  };
};

module.exports = { requirePermission };