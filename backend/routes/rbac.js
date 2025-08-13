// routes/rbac.js
// RBAC-related routes demonstrating the new permission system

const express = require('express');
const router = express.Router();
const { 
  authenticateToken, 
  requirePermission, 
  requireRole, 
  requireAnyPermission 
} = require('../middleware');
const {
  getMyPermissions,
  checkMyPermission,
  getUsers,
  createNewUser,
  assignUserRole,
  removeUserRole,
  getRolesAndPermissions
} = require('../controllers/rbacController');

/**
 * Public routes (no authentication required)
 */

/**
 * Authenticated routes (require valid JWT token)
 */
router.use(authenticateToken);

/**
 * GET /api/rbac/me - Get current user's permissions and roles
 */
router.get('/me', getMyPermissions);

/**
 * POST /api/rbac/check - Check if current user has specific permission
 * Body: { permission: "permission_name" }
 */
router.post('/check', checkMyPermission);

/**
 * Protected routes (require specific permissions)
 */

/**
 * GET /api/rbac/users - Get all users (requires view_users permission)
 */
router.get('/users', requirePermission('view_users'), getUsers);

/**
 * POST /api/rbac/users - Create new user (requires create_user permission)
 * Body: { username, password, email, company_id?, roles? }
 */
router.post('/users', requirePermission('create_user'), createNewUser);

/**
 * POST /api/rbac/users/:userId/roles - Assign role to user (requires manage_roles permission)
 * Body: { role: "role_name" }
 */
router.post('/users/:userId/roles', requirePermission('manage_roles'), assignUserRole);

/**
 * DELETE /api/rbac/users/:userId/roles/:role - Remove role from user (requires manage_roles permission)
 */
router.delete('/users/:userId/roles/:role', requirePermission('manage_roles'), removeUserRole);

/**
 * GET /api/rbac/roles - Get all roles and permissions (requires view_users permission)
 */
router.get('/roles', requirePermission('view_users'), getRolesAndPermissions);

/**
 * Example routes showing different permission requirements
 */

/**
 * GET /api/rbac/admin-only - Super admin only route
 */
router.get('/admin-only', requireRole('super_admin'), (req, res) => {
  res.json({ 
    message: 'Welcome super admin!', 
    user: req.userInstance.username,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/rbac/management - Management route (requires any management permission)
 */
router.get('/management', 
  requireAnyPermission(['manage_roles', 'create_user', 'delete_user']), 
  (req, res) => {
    res.json({ 
      message: 'Welcome to management area!', 
      user: req.userInstance.username,
      availableActions: ['User management', 'Role management', 'System administration']
    });
  }
);

/**
 * GET /api/rbac/campaigns - Campaign access (view_campaigns permission)
 */
router.get('/campaigns', requirePermission('view_campaigns'), (req, res) => {
  res.json({ 
    message: 'Campaign data access granted', 
    user: req.userInstance.username,
    note: 'This user can view campaigns'
  });
});

module.exports = router;
