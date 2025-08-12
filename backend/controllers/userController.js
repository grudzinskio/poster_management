// controllers/userController.js
// User management controller - CRUD operations for users

const knex = require('../config/knex');
const { hashPassword } = require('../services/authService');

/**
 * GET /api/users - Retrieve users with optional role filtering
 */
async function getAllUsers(req, res) {
  try {
    const { role } = req.query;
    
    let query = knex('users as u')
      .leftJoin('companies as c', 'u.company_id', 'c.id')
      .select('u.id', 'u.username', 'u.role', 'u.company_id', 'c.name as company_name')
      .orderBy('u.id', 'desc');
    
    if (role) {
      query = query.where('u.role', role);
    }
    
    const rows = await query;
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * POST /api/users - Create a new user
 * Body: { username, password, role, company_id? }
 * Note: Passwords are securely hashed using bcrypt before storage
 */
async function createUser(req, res) {
  const { username, password, role, company_id } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required' });
  }
  
  try {
    // Hash the password before storing it
    const hashedPassword = await hashPassword(password);
    
    // Store hashed password instead of plaintext
    const [insertId] = await knex('users').insert({
      username,
      password: hashedPassword,
      role,
      company_id: company_id || null
    });
    
    // Retrieve the created user with company information using JOIN
    const user = await knex('users as u')
      .leftJoin('companies as c', 'u.company_id', 'c.id')
      .select('u.id', 'u.username', 'u.role', 'u.company_id', 'c.name as company_name')
      .where('u.id', insertId)
      .first();
    
    res.status(201).json(user);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

/**
 * PUT /api/users/:id - Update user information and company assignment
 * Params: id (user ID)
 * Body: { username, role, company_id? }
 */
async function updateUser(req, res) {
  const { id } = req.params;
  const { username, role, company_id } = req.body;
  
  if (!username || !role) {
    return res.status(400).json({ error: 'Username and role are required' });
  }
  
  try {
    const affectedRows = await knex('users')
      .where('id', id)
      .update({
        username,
        role,
        company_id: company_id || null
      });
    
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Retrieve the updated user with company information
    const user = await knex('users as u')
      .leftJoin('companies as c', 'u.company_id', 'c.id')
      .select('u.id', 'u.username', 'u.role', 'u.company_id', 'c.name as company_name')
      .where('u.id', id)
      .first();
    
    res.json(user);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

/**
 * PUT /api/users/:id/password - Update user password
 * Params: id (user ID)
 * Body: { password: string }
 * Note: Passwords are securely hashed using bcrypt before storage
 */
async function updateUserPassword(req, res) {
  const { id } = req.params;
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  try {
    // Hash the new password before storing it
    const hashedPassword = await hashPassword(password);
    
    const affectedRows = await knex('users')
      .where('id', id)
      .update({ password: hashedPassword });
    
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating user password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
}

/**
 * DELETE /api/users/:id - Delete a user
 * Params: id (user ID)
 * Constraint: Users cannot delete their own account
 */
async function deleteUser(req, res) {
  const { id } = req.params;
  
  // Prevent users from deleting their own account
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  try {
    const affectedRows = await knex('users')
      .where('id', id)
      .del();
    
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser
};
