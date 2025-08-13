// routes/roles.js
// Role and permission management routes
// Updated for 4-table RBAC structure (roles as strings, not IDs)

const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware');
const { 
  getAllRoles, 
  getRolePermissions, 
  createRole, 
  updateRolePermissions, 
  deleteRole 
} = require('../controllers/roleController');

/**
 * GET /api/roles - Retrieve all roles (for user management dropdowns)
 * Requires: Authentication + view_roles permission (more accessible)
 */
router.get('/', authenticateToken, requirePermission('view_roles'), getAllRoles);

/**
 * GET /api/roles/manage - Retrieve all roles (for role management admin)
 * Requires: Authentication + manage_roles permission
 */
router.get('/manage', authenticateToken, requirePermission('manage_roles'), getAllRoles);

/**
 * GET /api/roles/:roleName/permissions - Retrieve permissions for a specific role
 * Requires: Authentication + manage_roles permission
 * Note: Now uses roleName (string) instead of id
 */
router.get('/:roleName/permissions', authenticateToken, requirePermission('manage_roles'), getRolePermissions);

/**
 * POST /api/roles - Create a new role
 * Requires: Authentication + manage_roles permission
 */
router.post('/', authenticateToken, requirePermission('manage_roles'), createRole);

/**
 * PUT /api/roles/:roleName/permissions - Update role permissions
 * Requires: Authentication + manage_roles permission
 * Note: Now uses roleName (string) instead of id
 */
router.put('/:roleName/permissions', authenticateToken, requirePermission('manage_roles'), updateRolePermissions);

/**
 * DELETE /api/roles/:roleName - Delete a role
 * Requires: Authentication + manage_roles permission
 * Note: Now uses roleName (string) instead of id
 */
router.delete('/:roleName', authenticateToken, requirePermission('manage_roles'), deleteRole);

module.exports = router;
