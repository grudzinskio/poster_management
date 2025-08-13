// Enhanced middleware that attaches the User instance to the request
const jwt = require('jsonwebtoken');
const { can, hasRole, getUserRoles } = require('../services/authService');
const { getUserById } = require('../services/userService');

/**
 * Enhanced authentication middleware - Verifies JWT tokens and attaches User instance
 * Uses Bearer token authentication scheme
 * Protects routes from unauthorized access and provides enhanced User object
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get full User instance with permission methods
    const user = await getUserById(decoded.id);
    if (!user) {
      return res.sendStatus(403);
    }
    
    // Attach both decoded token data and User instance
    req.user = decoded;
    req.userInstance = user;
    
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
};

/**
 * Permission-based authorization middleware using the new can() method
 * Works with both the User instance and direct permission checking
 */
const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      // Use the User instance if available, fallback to direct check
      let hasPermission = false;
      
      if (req.userInstance) {
        hasPermission = await req.userInstance.can(permissionName);
      } else {
        hasPermission = await can(req.user.id, permissionName);
      }
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: `Access denied. Required permission: ${permissionName}` 
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in permission authorization:', error);
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

/**
 * Role-based authorization middleware
 */
const requireRole = (roleName) => {
  return async (req, res, next) => {
    try {
      let hasRolePermission = false;
      
      if (req.userInstance) {
        hasRolePermission = await req.userInstance.hasRole(roleName);
      } else {
        hasRolePermission = await hasRole(req.user.id, roleName);
      }
      
      if (!hasRolePermission) {
        return res.status(403).json({ 
          error: `Access denied. Required role: ${roleName}` 
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in role authorization:', error);
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

/**
 * Multiple permissions authorization - user must have ANY of the specified permissions
 */
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      let hasAnyPermission = false;
      
      if (req.userInstance) {
        hasAnyPermission = await req.userInstance.canAny(permissions);
      } else {
        for (const permission of permissions) {
          if (await can(req.user.id, permission)) {
            hasAnyPermission = true;
            break;
          }
        }
      }
      
      if (!hasAnyPermission) {
        return res.status(403).json({ 
          error: `Access denied. Required one of: ${permissions.join(', ')}` 
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in multiple permissions authorization:', error);
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

/**
 * Multiple permissions authorization - user must have ALL of the specified permissions
 */
const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      let hasAllPermissions = false;
      
      if (req.userInstance) {
        hasAllPermissions = await req.userInstance.canAll(permissions);
      } else {
        hasAllPermissions = true;
        for (const permission of permissions) {
          if (!(await can(req.user.id, permission))) {
            hasAllPermissions = false;
            break;
          }
        }
      }
      
      if (!hasAllPermissions) {
        return res.status(403).json({ 
          error: `Access denied. Required all of: ${permissions.join(', ')}` 
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in all permissions authorization:', error);
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  requireAnyPermission,
  requireAllPermissions,
  // Legacy aliases for backward compatibility
  authorizePermission: requirePermission,
  authorizeRole: requireRole,
  authorizeAnyRole: (roles) => requireAnyPermission(roles)
};
