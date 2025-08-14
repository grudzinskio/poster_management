// controllers/userController.js
// User management controller - CRUD operations for users

const knex = require('../config/knex');
const { hashPassword, getUserRoles } = require('../services/authService');

/**
 * GET /api/users - Retrieve users with their roles and optional role filtering
 */
async function getAllUsers(req, res) {
  try {
    const { role } = req.query;
    
    // Get all users with their company information
    let userQuery = knex('users as u')
      .leftJoin('companies as c', 'u.company_id', 'c.id')
      .select('u.id', 'u.username', 'u.user_type', 'u.company_id', 'c.name as company_name')
      .orderBy('u.id', 'desc');
    
    const users = await userQuery;
    
    // Get roles for each user
    const usersWithRoles = await Promise.all(users.map(async (user) => {
      const roles = await getUserRoles(user.id);
      const roleNames = roles.map(r => r.name);
      
      return {
        ...user,
        roles: roleNames
      };
    }));
    
    // Filter by role if specified
    let filteredUsers = usersWithRoles;
    if (role) {
      filteredUsers = usersWithRoles.filter(user => user.roles.includes(role));
    }
    
    res.json(filteredUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * POST /api/users - Create a new user with role assignment
 * Body: { username, password, user_type, roles: [string], company_id? }
 * Note: Passwords are securely hashed using bcrypt before storage
 */
async function createUser(req, res) {
  const { username, password, user_type, roles, company_id } = req.body;
  if (!username || !password || !user_type || !roles || !Array.isArray(roles) || roles.length === 0) {
    return res.status(400).json({ error: 'Username, password, user_type, and at least one role are required' });
  }
  
  // Validate user_type
  if (!['employee', 'client', 'contractor'].includes(user_type)) {
    return res.status(400).json({ error: 'user_type must be one of: employee, client, contractor' });
  }
  
  const trx = await knex.transaction();
  
  try {
    // Hash the password before storing it
    const hashedPassword = await hashPassword(password);
    
    // Create the user
    const [insertId] = await trx('users').insert({
      username,
      password: hashedPassword,
      user_type,
      company_id: company_id || null
    });
    
    // Get role IDs for the provided role names
    const roleRecords = await trx('roles')
      .whereIn('name', roles)
      .select('id', 'name');
    
    if (roleRecords.length !== roles.length) {
      await trx.rollback();
      return res.status(400).json({ error: 'One or more invalid roles provided' });
    }
    
    // Assign roles to user
    const userRoleInserts = roleRecords.map(role => ({
      user: insertId,
      role: role.id
    }));
    
    await trx('user_roles').insert(userRoleInserts);
    
    // Retrieve the created user with company information
    const user = await trx('users as u')
      .leftJoin('companies as c', 'u.company_id', 'c.id')
      .select('u.id', 'u.username', 'u.user_type', 'u.company_id', 'c.name as company_name')
      .where('u.id', insertId)
      .first();
    
    // Add roles to the response
    user.roles = roles;
    
    await trx.commit();
    res.status(201).json(user);
  } catch (error) {
    await trx.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

/**
 * PUT /api/users/:id - Update user information, company assignment, and roles
 * Params: id (user ID)
 * Body: { username, user_type, roles: [string], company_id? }
 */
async function updateUser(req, res) {
  const { id } = req.params;
  const { username, user_type, company_id } = req.body;

  if (!username || !user_type) {
    return res.status(400).json({ error: 'Username and user_type are required' });
  }

  // Validate user_type
  if (!['employee', 'client', 'contractor'].includes(user_type)) {
    return res.status(400).json({ error: 'user_type must be one of: employee, client, contractor' });
  }

  const trx = await knex.transaction();

  try {
    // Update user basic information
    const affectedRows = await trx('users')
      .where('id', id)
      .update({
        username,
        user_type,
        company_id: company_id || null
      });

    if (affectedRows === 0) {
      await trx.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    // Retrieve the updated user with company information
    const user = await trx('users as u')
      .leftJoin('companies as c', 'u.company_id', 'c.id')
      .select('u.id', 'u.username', 'u.user_type', 'u.company_id', 'c.name as company_name')
      .where('u.id', id)
      .first();

    await trx.commit();
    res.json(user);
  } catch (error) {
    await trx.rollback();
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
 * DELETE /api/users/:id - Delete a user and their role assignments
 * Params: id (user ID)
 * Constraint: Users cannot delete their own account
 */
async function deleteUser(req, res) {
  const { id } = req.params;
  
  // Prevent users from deleting their own account
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }
  
  const trx = await knex.transaction();
  
  try {
    // Delete user role assignments first (due to foreign key constraints)
    await trx('user_roles').where('user', id).del();
    
    // Delete the user
    const affectedRows = await trx('users')
      .where('id', id)
      .del();
    
    if (affectedRows === 0) {
      await trx.rollback();
      return res.status(404).json({ error: 'User not found' });
    }
    
    await trx.commit();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    await trx.rollback();
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
