// routes/users.js
// User management routes - CRUD operations for users

const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { getAllUsers, createUser, updateUser, updateUserPassword, deleteUser } = require('../controllers/userController');

/**
 * GET /api/users - Retrieve all users with company information
 * Requires: Authentication + Employee role
 * Returns: Users with joined company data using LEFT JOIN
 */
router.get('/', authenticateToken, authorizeRole('employee'), getAllUsers);

/**
 * POST /api/users - Create a new user
 * Requires: Authentication + Employee role
 * Body: { username, password, role, company_id? }
 * Note: Passwords are securely hashed using bcrypt before storage
 */
router.post('/', authenticateToken, authorizeRole('employee'), createUser);

/**
 * PUT /api/users/:id - Update user information and company assignment
 * Requires: Authentication + Employee role
 * Params: id (user ID)
 * Body: { username, role, company_id? }
 */
router.put('/:id', authenticateToken, authorizeRole('employee'), updateUser);

/**
 * PUT /api/users/:id/password - Update user password
 * Requires: Authentication + Employee role
 * Params: id (user ID)
 * Body: { password: string }
 * Note: Passwords are securely hashed using bcrypt before storage
 */
router.put('/:id/password', authenticateToken, authorizeRole('employee'), updateUserPassword);

/**
 * DELETE /api/users/:id - Delete a user
 * Requires: Authentication + Employee role
 * Params: id (user ID)
 * Constraint: Users cannot delete their own account
 */
router.delete('/:id', authenticateToken, authorizeRole('employee'), deleteUser);

module.exports = router;
