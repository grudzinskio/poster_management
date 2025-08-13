// routes/users.js
// User management routes - CRUD operations for users

const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware');
const { getAllUsers, createUser, updateUser, updateUserPassword, deleteUser } = require('../controllers/userController');

/**
 * GET /api/users/me/permissions - Get current user's permissions as simple array
 * Requires: Authentication only
 * Returns: Array of permission strings
 */
router.get('/me/permissions', authenticateToken, async (req, res) => {
  try {
    const user = req.userInstance;
    const permissions = await user.getPermissions();
    
    // Return simple array of permission names
    const permissionArray = permissions.map(p => p.permission);
    
    res.json(permissionArray);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users - Retrieve all users with company information and roles
 * Requires: Authentication + view_users permission
 * Returns: Users with joined company data and their assigned roles
 */
router.get('/', authenticateToken, requirePermission('view_users'), getAllUsers);

/**
 * POST /api/users - Create a new user with role assignments
 * Requires: Authentication + create_user permission
 * Body: { username, password, roles: [string], company_id? }
 * Note: Passwords are securely hashed using bcrypt before storage
 */
router.post('/', authenticateToken, requirePermission('create_user'), createUser);

/**
 * PUT /api/users/:id - Update user information, company assignment, and roles
 * Requires: Authentication + edit_user permission
 * Params: id (user ID)
 * Body: { username, roles: [string], company_id? }
 */
router.put('/:id', authenticateToken, requirePermission('edit_user'), updateUser);

/**
 * PUT /api/users/:id/password - Update user password
 * Requires: Authentication + edit_user permission
 * Params: id (user ID)
 * Body: { password: string }
 * Note: Passwords are securely hashed using bcrypt before storage
 */
router.put('/:id/password', authenticateToken, requirePermission('edit_user'), updateUserPassword);

/**
 * DELETE /api/users/:id - Delete a user and their role assignments
 * Requires: Authentication + delete_user permission
 * Params: id (user ID)
 * Constraint: Users cannot delete their own account
 */
router.delete('/:id', authenticateToken, requirePermission('delete_user'), deleteUser);

module.exports = router;
