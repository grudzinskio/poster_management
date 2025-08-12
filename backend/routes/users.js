// routes/users.js
// User management routes - CRUD operations for users

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizePermission } = require('../middleware/auth');
const { getAllUsers, createUser, updateUser, updateUserPassword, deleteUser } = require('../controllers/userController');

/**
 * GET /api/users - Retrieve all users with company information and roles
 * Requires: Authentication + permission to read users
 * Returns: Users with joined company data and their assigned roles
 */
router.get('/', authenticateToken, authorizePermission('view_user_list'), getAllUsers);

/**
 * POST /api/users - Create a new user with role assignments
 * Requires: Authentication + permission to create users
 * Body: { username, password, roles: [string], company_id? }
 * Note: Passwords are securely hashed using bcrypt before storage
 */
router.post('/', authenticateToken, authorizePermission('save_new_user'), createUser);

/**
 * PUT /api/users/:id - Update user information, company assignment, and roles
 * Requires: Authentication + permission to update users
 * Params: id (user ID)
 * Body: { username, roles: [string], company_id? }
 */
router.put('/:id', authenticateToken, authorizePermission('update_user_data'), updateUser);

/**
 * PUT /api/users/:id/password - Update user password
 * Requires: Authentication + permission to update users
 * Params: id (user ID)
 * Body: { password: string }
 * Note: Passwords are securely hashed using bcrypt before storage
 */
router.put('/:id/password', authenticateToken, authorizePermission('change_user_password'), updateUserPassword);

/**
 * DELETE /api/users/:id - Delete a user and their role assignments
 * Requires: Authentication + permission to delete users
 * Params: id (user ID)
 * Constraint: Users cannot delete their own account
 */
router.delete('/:id', authenticateToken, authorizePermission('remove_user_record'), deleteUser);

module.exports = router;
