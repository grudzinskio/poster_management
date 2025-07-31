// controllers/authController.js
// Authentication controller handling login logic

const { pool } = require('../config/database');
const { hashPassword, comparePassword, isPasswordHashed, generateToken } = require('../services/authService');

/**
 * User login controller
 * POST /api/login
 * Uses bcrypt for secure password comparison
 * Returns JWT token on successful authentication
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Database query using connection pool and prepared statements for security
    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
      'SELECT u.id, u.username, u.password, u.role, u.company_id, c.name as company_name FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.username = ?',
      [username]  // Parameterized query prevents SQL injection
    );
    conn.release();  // Release connection back to pool

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];

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
        const conn2 = await pool.getConnection();
        await conn2.execute(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, user.id]
        );
        conn2.release();
        console.log(`Auto-migrated password for user: ${user.username}`);
      }
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Create JWT payload with user information
    const userPayload = { 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      company_id: user.company_id,
      company_name: user.company_name
    };
    
    // Generate JWT token with 1-hour expiration
    const accessToken = generateToken(userPayload);

    // Return successful login response with token and user data
    res.json({
      success: true,
      token: accessToken,
      user: userPayload
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
    const conn = await pool.getConnection();
    
    // Get all users with plaintext passwords (assume they're shorter than typical bcrypt hashes)
    // Bcrypt hashes are always 60 characters, so we can identify plaintext by length
    const [users] = await conn.execute(
      'SELECT id, username, password FROM users WHERE LENGTH(password) < 60'
    );
    
    if (users.length === 0) {
      conn.release();
      return res.json({ 
        success: true, 
        message: 'No plaintext passwords found. All passwords are already hashed.',
        migrated: 0 
      });
    }
    
    let migratedCount = 0;
    
    // Hash each plaintext password
    for (const user of users) {
      const hashedPassword = await hashPassword(user.password);
      await conn.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      migratedCount++;
    }
    
    conn.release();
    
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
