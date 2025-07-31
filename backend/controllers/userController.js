// controllers/userController.js
// User management controller - CRUD operations for users

const { pool } = require('../config/database');
const { hashPassword } = require('../services/authService');

/**
 * GET /api/users - Retrieve all users with company information
 * Returns: Users with joined company data using LEFT JOIN
 */
async function getAllUsers(req, res) {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.execute(`
      SELECT u.id, u.username, u.role, u.company_id, c.name as company_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      ORDER BY u.username
    `);
    conn.release();
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
    
    const conn = await pool.getConnection();
    // Store hashed password instead of plaintext
    const [result] = await conn.execute(
      'INSERT INTO users (username, password, role, company_id) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, role, company_id || null]
    );
    
    // Retrieve the created user with company information using JOIN
    const [userRows] = await conn.execute(`
      SELECT u.id, u.username, u.role, u.company_id, c.name as company_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.id = ?
    `, [result.insertId]);
    
    conn.release();
    
    res.status(201).json(userRows[0]);
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
    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'UPDATE users SET username = ?, role = ?, company_id = ? WHERE id = ?',
      [username, role, company_id || null, id]
    );
    
    if (result.affectedRows === 0) {
      conn.release();
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Retrieve updated user with company information
    const [userRows] = await conn.execute(`
      SELECT u.id, u.username, u.role, u.company_id, c.name as company_name
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.id = ?
    `, [id]);
    
    conn.release();
    
    res.json(userRows[0]);
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
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  
  try {
    // Hash the new password
    const hashedPassword = await hashPassword(password);
    
    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    
    conn.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
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
  if (parseInt(id, 10) === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own account." });
  }

  try {
    const conn = await pool.getConnection();
    
    // First, update any campaigns created by this user to set created_by to NULL
    // This maintains the campaign-company association while removing the user reference
    await conn.execute(
      'UPDATE campaigns SET created_by = NULL WHERE created_by = ?',
      [id]
    );
    
    // Now safely delete the user
    const [result] = await conn.execute('DELETE FROM users WHERE id = ?', [id]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    
    // Handle specific database constraint errors
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        error: 'Cannot delete user because they have associated data. Please contact an administrator.' 
      });
    }
    
    // Handle other specific MySQL errors
    if (error.code) {
      return res.status(500).json({ 
        error: `Database error: ${error.code} - ${error.sqlMessage}` 
      });
    }
    
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
