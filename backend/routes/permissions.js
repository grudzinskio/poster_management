// routes/permissions.js
// Permission management routes

const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware');
const { getAllPermissions } = require('../controllers/roleController');

/**
 * GET /api/permissions - Retrieve all permissions
 * Public endpoint (requires authentication but no special permission)
 */
router.get('/', authenticateToken, getAllPermissions);

/**
 * GET /api/permissions/manage - Manage permissions (admin only)
 * Requires: Authentication + manage_roles permission
 */
router.get('/manage', authenticateToken, requirePermission('manage_roles'), getAllPermissions);

module.exports = router;
