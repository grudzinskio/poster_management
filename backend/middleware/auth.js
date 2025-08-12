// middleware/auth.js
// JWT-based authentication and authorization middleware

const jwt = require('jsonwebtoken');
const { hasPermission, hasRole, getUserRoles } = require('../services/authService');

/**
 * Authentication middleware - Verifies JWT tokens in request headers
 * Uses Bearer token authentication scheme
 * Protects routes from unauthorized access
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];    // Extract Authorization header
  const token = authHeader && authHeader.split(' ')[1]; // Get token from "Bearer <token>"

  if (token == null) return res.sendStatus(401);     // No token provided

  // Verify JWT token using secret from environment variables
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);             // Invalid/expired token
    req.user = user;                                 // Attach user info to request
    next();                                          // Continue to next middleware
  });
};

/**
 * Role-based authorization middleware
 * Restricts access based on user roles (employee, client, contractor)
 * Higher-order function that returns middleware for specific roles
 */
const authorizeRole = (role) => {
  return async (req, res, next) => {
    try {
      const userHasRole = await hasRole(req.user.id, role);
      if (!userHasRole) {
        return res.status(403).json({ error: 'Not authorized for this action' });
      }
      next();
    } catch (error) {
      console.error('Error in role authorization:', error);
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

/**
 * Permission-based authorization middleware
 * Restricts access based on specific permissions/functions
 * Higher-order function that returns middleware for specific functions
 */
const authorizePermission = (functionName) => {
  return async (req, res, next) => {
    try {
      const userHasPermission = await hasPermission(req.user.id, functionName);
      if (!userHasPermission) {
        return res.status(403).json({ error: 'Not authorized for this action' });
      }
      next();
    } catch (error) {
      console.error('Error in permission authorization:', error);
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

/**
 * Multiple roles authorization middleware
 * Allows access if user has any of the specified roles
 */
const authorizeAnyRole = (roles) => {
  return async (req, res, next) => {
    try {
      const userRoles = await getUserRoles(req.user.id);
      const hasAnyRole = roles.some(role => userRoles.includes(role));
      
      if (!hasAnyRole) {
        return res.status(403).json({ error: 'Not authorized for this action' });
      }
      next();
    } catch (error) {
      console.error('Error in multiple role authorization:', error);
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
  authorizePermission,
  authorizeAnyRole
};
