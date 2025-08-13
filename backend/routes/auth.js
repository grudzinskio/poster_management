// routes/auth.js
// Authentication routes

const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware');
const { login, migratePasswords, checkPermission } = require('../controllers/authController');

/**
 * POST /api/login - User authentication
 * Uses bcrypt for secure password comparison
 * Returns JWT token on successful authentication
 */
router.post('/login', login);

/**
 * POST /api/check-permission - Check if user has specific permission
 * Requires: Authentication
 * Body: { permission: "permission_name" }
 */
router.post('/check-permission', authenticateToken, checkPermission);

/**
 * POST /api/migrate-passwords - Migrate plaintext passwords to hashed passwords
 * Requires: Authentication + manage_roles permission
 * Note: This is a one-time migration utility for existing users
 * WARNING: Only run this once on production data
 */
router.post('/migrate-passwords', authenticateToken, requirePermission('manage_roles'), migratePasswords);

module.exports = router;
