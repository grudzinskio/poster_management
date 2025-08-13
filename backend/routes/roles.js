// routes/roles.js
// Role and permission management routes
// Updated for 4-table RBAC structure (roles as strings, not IDs)

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizePermission } = require('../middleware/auth');
const { 
  getAllRoles, 
  getRolePermissions, 
  createRole, 
  updateRolePermissions, 
  deleteRole 
} = require('../controllers/roleController');

/**
 * GET /api/roles - Retrieve all roles
 * Requires: Authentication + permission to read roles
 */
router.get('/', authenticateToken, authorizePermission('getAllRoles'), getAllRoles);

/**
 * GET /api/roles/:roleName/permissions - Retrieve permissions for a specific role
 * Requires: Authentication + permission to read roles
 * Note: Now uses roleName (string) instead of id
 */
router.get('/:roleName/permissions', authenticateToken, authorizePermission('getAllRoles'), getRolePermissions);

/**
 * POST /api/roles - Create a new role
 * Requires: Authentication + permission to create roles
 */
router.post('/', authenticateToken, authorizePermission('createRole'), createRole);

/**
 * PUT /api/roles/:roleName/permissions - Update role permissions
 * Requires: Authentication + permission to update roles
 * Note: Now uses roleName (string) instead of id
 */
router.put('/:roleName/permissions', authenticateToken, authorizePermission('updateRole'), updateRolePermissions);

/**
 * DELETE /api/roles/:roleName - Delete a role
 * Requires: Authentication + permission to delete roles
 * Note: Now uses roleName (string) instead of id
 */
router.delete('/:roleName', authenticateToken, authorizePermission('deleteRole'), deleteRole);

module.exports = router;
