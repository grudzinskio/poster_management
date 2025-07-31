// middleware/auth.js
// JWT-based authentication and authorization middleware

const jwt = require('jsonwebtoken');

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
 * Restricts access based on user roles (employee, client)
 * Higher-order function that returns middleware for specific roles
 */
const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};
