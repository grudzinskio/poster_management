// Unified authentication and authorization middleware
const jwt = require('jsonwebtoken');
const { getUserById } = require('../services/userService');

/**
 * Single authentication middleware that handles everything
 * Attaches both basic user data and enhanced User instance
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get enhanced User instance
    const userInstance = await getUserById(decoded.id);
    if (!userInstance) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    // Attach both to request for flexibility
    req.user = decoded;           // Basic token data
    req.userInstance = userInstance; // Enhanced User instance
    
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

/**
 * Simple permission check - works with the User instance
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.userInstance) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasPermission = await req.userInstance.can(permission);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: `Permission denied: ${permission}` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

/**
 * Simple role check - works with the User instance  
 */
const requireRole = (role) => {
  return async (req, res, next) => {
    try {
      if (!req.userInstance) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasRole = await req.userInstance.hasRole(role);
      if (!hasRole) {
        return res.status(403).json({ 
          error: `Role required: ${role}` 
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Role check failed' });
    }
  };
};

/**
 * Check for any of multiple permissions
 */
const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.userInstance) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasAny = await req.userInstance.canAny(permissions);
      if (!hasAny) {
        return res.status(403).json({ 
          error: `One of these permissions required: ${permissions.join(', ')}` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  requireAnyPermission
};
