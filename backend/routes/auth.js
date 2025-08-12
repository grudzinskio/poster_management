// routes/auth.js
// Authentication routes

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizePermission } = require('../middleware/auth');
const { login, migratePasswords } = require('../controllers/authController');

/**
 * POST /api/login - User authentication
 * Uses bcrypt for secure password comparison
 * Returns JWT token on successful authentication
 */
router.post('/login', login);

/**
 * POST /api/migrate-passwords - Migrate plaintext passwords to hashed passwords
 * Requires: Authentication + Employee role (legacy, keeping for compatibility)
 * Note: This is a one-time migration utility for existing users
 * WARNING: Only run this once on production data
 */
router.post('/migrate-passwords', authenticateToken, authorizePermission('migratePasswords'), migratePasswords);

module.exports = router;
