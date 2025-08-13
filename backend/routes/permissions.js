// routes/permissions.js
// Permission management routes

const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/enhancedAuth');
const { getAllPermissions } = require('../controllers/roleController');

/**
 * GET /api/permissions - Retrieve all permissions
 * Requires: Authentication + manage_roles permission
 */
router.get('/', authenticateToken, requirePermission('manage_roles'), getAllPermissions);

module.exports = router;
