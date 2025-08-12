// routes/permissions.js
// Permission management routes

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizePermission } = require('../middleware/auth');
const { getAllPermissions } = require('../controllers/roleController');

/**
 * GET /api/permissions - Retrieve all permissions
 * Requires: Authentication + permission to read permissions
 */
router.get('/', authenticateToken, authorizePermission('getAllPermissions'), getAllPermissions);

module.exports = router;
