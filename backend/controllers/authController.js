// controllers/authController.js
// Authentication controller handling login logic

const knex = require('../config/knex');
const { hashPassword, comparePassword, isPasswordHashed, generateToken, getUserRoles } = require('../services/authService');

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
    // Find user using Knex - no need to get role from users table anymore
    const user = await knex('users')
      .leftJoin('companies', 'users.company_id', 'companies.id')
      .select('users.*', 'companies.name as company_name')
      .where('users.username', username)
      .first();

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Password verification - handle both plaintext and hashed passwords
    let isValidPassword = false;
    
    // Check if password is already hashed
    if (isPasswordHashed(user.password)) {
      // It's a bcrypt hash, use bcrypt.compare
      isValidPassword = await comparePassword(password, user.password);
    } else {
      // It's plaintext, do direct comparison
      isValidPassword = (password === user.password);
      
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
    const token = generateToken({
      id: user.id,
      username: user.username,
      user_type: user.user_type,
      roles: roles,
      company_id: user.company_id
    });
    
    // Return success response with token and user info
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        user_type: user.user_type,
        roles: roles,
        company_id: user.company_id,
        company_name: user.company_name
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

module.exports = {
  login,
  migratePasswords
};
