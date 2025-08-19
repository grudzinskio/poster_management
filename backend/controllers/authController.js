// controllers/authController.js
// Authentication controller handling login logic

const knex = require('../config/knex');
const { hashPassword, comparePassword, isPasswordHashed, generateToken, getUserRoles, can } = require('../services/authService');
const { getUserByUsername } = require('../services/userService');

/**
 * User login controller
 * POST /api/login
 * Uses bcrypt for secure password comparison
 * Returns JWT token on successful authentication
 */
async function login(req, res) {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Find user using the new User service
    const user = await getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Get raw user data for password checking
    const rawUserData = await knex('users')
      .where('username', username)
      .first();

    // Password verification - handle both plaintext and hashed passwords
    let isValidPassword = false;
    
    // Check if password is already hashed
    if (isPasswordHashed(rawUserData.password)) {
      // It's a bcrypt hash, use bcrypt.compare
      isValidPassword = await comparePassword(password, rawUserData.password);
    } else {
      // It's plaintext, do direct comparison
      isValidPassword = (password === rawUserData.password);
      
      // Auto-migrate this password to hashed format
      if (isValidPassword) {
        const hashedPassword = await hashPassword(password);
        await knex('users')
          .where('id', user.id)
          .update({ password: hashedPassword });
        console.log(`Auto-migrated password for user: ${user.username}`);
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const roles = await getUserRoles(user.id);
    const roleNames = roles.map(r => r.name); // get array of role names
    const token = generateToken({
      id: user.id,
      username: user.username,
      roles: roleNames,
      company_id: user.company_id
    });

    // Return success response with token and user info
    res.json({
      token,
      user: {
        ...user.toJSON(),
        roles: roleNames
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Migrate plaintext passwords to hashed passwords
 * POST /api/migrate-passwords
 * Note: This is a one-time migration utility for existing users
 * WARNING: Only run this once on production data
 */
async function migratePasswords(req, res) {
  try {
    const users = await knex('users').select('*');
    let migratedCount = 0;
    
    for (const user of users) {
      if (!isPasswordHashed(user.password)) {
        const hashedPassword = await hashPassword(user.password);
        await knex('users')
          .where('id', user.id)
          .update({ password: hashedPassword });
        migratedCount++;
      }
    }
    
    res.json({ 
      success: true, 
      message: `Successfully migrated ${migratedCount} user password(s) to secure hashes.`,
      migrated: migratedCount 
    });
    
  } catch (error) {
    console.error('Error migrating passwords:', error);
    res.status(500).json({ error: 'Failed to migrate passwords' });
  }
}

/**
 * Check user permission
 * POST /api/check-permission
 * Checks if the authenticated user has a specific permission
 */
async function checkPermission(req, res) {
  const { permission } = req.body;
  const userId = req.user?.id;
  
  if (!permission) {
    return res.status(400).json({ error: 'Permission name is required' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const hasPermission = await can(userId, permission);
    
    res.json({
      permission,
      allowed: hasPermission
    });
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  login,
  migratePasswords,
  checkPermission
};
