// routes/roles.js
// Role and permission management routes

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizePermission } = require('../middleware/auth');
const { 
  getAllRoles, 
  getRolePermissions, 
  createRole, 
  updateRolePermissions, 
  updateRole, 
  deleteRole 
} = require('../controllers/roleController');



/**
 * GET /api/roles - Retrieve all roles
 * Requires: Authentication + permission to read roles
 */
router.get('/', authenticateToken, authorizePermission('getAllRoles'), getAllRoles);

/**
 * GET /api/roles/:id/permissions - Retrieve permissions for a specific role
 * Requires: Authentication + permission to read roles
 */
router.get('/:id/permissions', authenticateToken, authorizePermission('getAllRoles'), getRolePermissions);

/**
 * POST /api/roles - Create a new role
 * Requires: Authentication + permission to create roles
 */
router.post('/', authenticateToken, authorizePermission('createRole'), createRole);

/**
 * PUT /api/roles/:id/permissions - Update role permissions
 * Requires: Authentication + permission to update roles
 */
router.put('/:id/permissions', authenticateToken, authorizePermission('updateRole'), updateRolePermissions);

/**
 * PUT /api/roles/:id - Update role information
 * Requires: Authentication + permission to update roles
 */
router.put('/:id', authenticateToken, authorizePermission('updateRole'), updateRole);

/**
 * DELETE /api/roles/:id - Delete a role
 * Requires: Authentication + permission to delete roles
 */
router.delete('/:id', authenticateToken, authorizePermission('deleteRole'), deleteRole);

module.exports = router;
