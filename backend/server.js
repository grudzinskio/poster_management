// backend/server.js
// Main server file for the poster management application backend

// Environment configuration - dotenv loads environment variables from .env file
require('dotenv').config({ path: '../.env' });

// Core dependencies and tools used:
const express = require('express');         // Express.js - Web application framework for Node.js
const cors = require('cors');               // CORS - Cross-Origin Resource Sharing middleware
const mysql = require('mysql2/promise');    // MySQL2 - MySQL client with Promise support for database operations
const jwt = require('jsonwebtoken');        // JWT - JSON Web Token library for authentication
const bcrypt = require('bcrypt');           // bcrypt - Secure password hashing library

// Express.js application instance
const app = express();
const PORT = 3001;

// Middleware configuration
app.use(cors());             // Enable CORS for cross-origin requests from frontend
app.use(express.json());     // Parse JSON request bodies

// MySQL database connection configuration
// Uses connection pooling for better performance and resource management
// MySQL connection pool configuration using environment variables
const dbConfig = {
  host: process.env.DB_HOST,           // Database server hostname
  user: process.env.DB_USER,           // Database username
  password: process.env.DB_PASSWORD,   // Database password
  database: process.env.DB_NAME,       // Database name
  port: process.env.DB_PORT || 3306,   // Database port (default MySQL port)
  waitForConnections: true,            // Queue connections when limit is reached
  connectionLimit: 10,                 // Maximum number of connections in pool
  queueLimit: 0,                       // No limit on queued connection requests
};

// Create MySQL connection pool for efficient database operations
const pool = mysql.createPool(dbConfig);

// --- AUTHENTICATION MIDDLEWARE ---
// JWT-based authentication and authorization system

/**
 * Authentication middleware - Verifies JWT tokens in request headers
 * Uses Bearer token authentication scheme
 * Protects routes from unauthorized access
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];    // Extract Authorization header
  const token = authHeader && authHeader.split(' ')[1]; // Get token from "Bearer <token>"

  if (token == null) return res.sendStatus(401);     // No token provided

  // Verify JWT token using secret from environment variables
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);             // Invalid/expired token
    req.user = user;                                 // Attach user info to request
    next();                                          // Continue to next middleware
  });
};

/**
 * Role-based authorization middleware
 * Restricts access based on user roles (employee, client)
 * Higher-order function that returns middleware for specific roles
 */
const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }
    next();
  };
};

// --- API Routes ---
// RESTful API endpoints for the poster management system

/**
 * Login endpoint - User authentication
 * POST /api/login
 * Uses bcrypt for secure password comparison
 * Returns JWT token on successful authentication
 */
app.post('/api/login', async (req, res) => {
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
    
    // Check if password is already hashed (bcrypt hashes are always 60 characters)
    if (user.password.length === 60 && user.password.startsWith('$2')) {
      // It's a bcrypt hash, use bcrypt.compare
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      // It's plaintext, do direct comparison
      isValidPassword = (password === user.password);
      
      // Auto-migrate this password to hashed format
      if (isValidPassword) {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
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
    const accessToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

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
});

// --- COMPANY MANAGEMENT ROUTES (FOR EMPLOYEES) ---
// CRUD operations for company management - restricted to employee role

/**
 * GET /api/companies - Retrieve all companies
 * Requires: Authentication + Employee role
 * Returns: List of companies with id and name
 */
app.get('/api/companies', authenticateToken, authorizeRole('employee'), async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.execute('SELECT id, name FROM companies ORDER BY name');
        conn.release();
        res.json(rows);
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Failed to fetch companies' });
    }
});

/**
 * POST /api/companies - Create a new company
 * Requires: Authentication + Employee role
 * Body: { name: string }
 * Handles: Duplicate name validation
 */
// CREATE a new company
app.post('/api/companies', authenticateToken, authorizeRole('employee'), async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
    }
    
    try {
        const conn = await pool.getConnection();
        const [result] = await conn.execute(
            'INSERT INTO companies (name) VALUES (?)',
            [name] 
        );
        conn.release();
        
        res.status(201).json({ 
            id: result.insertId, 
            name
        });
    } catch (error) {
        // Handle MySQL duplicate entry error
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Company name already exists' });
        }
        console.error('Error creating company:', error);
        res.status(500).json({ error: 'Failed to create company' });
    }
});

/**
 * PUT /api/companies/:id - Update an existing company
 * Requires: Authentication + Employee role
 * Params: id (company ID)
 * Body: { name: string }
 */
// UPDATE a company
app.put('/api/companies/:id', authenticateToken, authorizeRole('employee'), async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
    }
    
    try {
        const conn = await pool.getConnection();
        const [result] = await conn.execute(
            'UPDATE companies SET name = ? WHERE id = ?',
            [name, id]
        );
        conn.release();
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        
        res.json({ id: parseInt(id), name });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Company name already exists' });
        }
        console.error('Error updating company:', error);
        res.status(500).json({ error: 'Failed to update company' });
    }
});

/**
 * DELETE /api/companies/:id - Delete a company
 * Requires: Authentication + Employee role
 * Params: id (company ID)
 * Constraint: Cannot delete companies with associated users
 */
// DELETE a company
app.delete('/api/companies/:id', authenticateToken, authorizeRole('employee'), async (req, res) => {
    const { id } = req.params;
    
    try {
        const conn = await pool.getConnection();
        
        // Check for foreign key constraints before deletion
        const [userCheck] = await conn.execute('SELECT COUNT(*) as count FROM users WHERE company_id = ?', [id]);
        if (userCheck[0].count > 0) {
            conn.release();
            return res.status(400).json({ error: 'Cannot delete company with associated users. Please reassign users first.' });
        }
        
        const [result] = await conn.execute('DELETE FROM companies WHERE id = ?', [id]);
        conn.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ error: 'Failed to delete company' });
    }
});

// --- USER MANAGEMENT ROUTES (FOR EMPLOYEES) ---
// CRUD operations for user management - restricted to employee role

/**
 * GET /api/users - Retrieve all users with company information
 * Requires: Authentication + Employee role
 * Returns: Users with joined company data using LEFT JOIN
 */
// GET all users
app.get('/api/users', authenticateToken, authorizeRole('employee'), async (req, res) => {
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
});

/**
 * POST /api/users - Create a new user
 * Requires: Authentication + Employee role
 * Body: { username, password, role, company_id? }
 * Note: Passwords are securely hashed using bcrypt before storage
 */
// CREATE a new user
app.post('/api/users', authenticateToken, authorizeRole('employee'), async (req, res) => {
    const { username, password, role, company_id } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required' });
    }
    
    try {
        // Hash the password before storing it
        const saltRounds = 12; // Higher salt rounds for better security
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
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
});

/**
 * PUT /api/users/:id - Update user information and company assignment
 * Requires: Authentication + Employee role
 * Params: id (user ID)
 * Body: { username, role, company_id? }
 */
// UPDATE a user (including company assignment)
app.put('/api/users/:id', authenticateToken, authorizeRole('employee'), async (req, res) => {
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
});

/**
 * PUT /api/users/:id/password - Update user password
 * Requires: Authentication + Employee role
 * Params: id (user ID)
 * Body: { password: string }
 * Note: Passwords are securely hashed using bcrypt before storage
 */
// UPDATE user password
app.put('/api/users/:id/password', authenticateToken, authorizeRole('employee'), async (req, res) => {
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
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
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
});

/**
 * DELETE /api/users/:id - Delete a user
 * Requires: Authentication + Employee role
 * Params: id (user ID)
 * Constraint: Users cannot delete their own account
 */
// DELETE a user
app.delete('/api/users/:id', authenticateToken, authorizeRole('employee'), async (req, res) => {
    const { id } = req.params;
    // Prevent users from deleting their own account
    if (parseInt(id, 10) === req.user.id) {
        return res.status(400).json({ error: "You cannot delete your own account."});
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
});

/**
 * POST /api/migrate-passwords - Migrate plaintext passwords to hashed passwords
 * Requires: Authentication + Employee role
 * Note: This is a one-time migration utility for existing users
 * WARNING: Only run this once on production data
 */
app.post('/api/migrate-passwords', authenticateToken, authorizeRole('employee'), async (req, res) => {
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
        const saltRounds = 12;
        
        // Hash each plaintext password
        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, saltRounds);
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
});

/**
 * GET /api/campaigns - Retrieve campaigns based on user role
 * Requires: Authentication
 * Role-based filtering:
 * - Clients: Only see campaigns for their company
 * - Employees: See all campaigns across all companies
 */
// Get campaigns route
app.get('/api/campaigns', authenticateToken, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    let query, params;
    
    if (req.user.role === 'client') {
      // Role-based query: Clients can only see campaigns for their company
      query = `
        SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, c.created_at, co.name as company_name
        FROM campaigns c
        JOIN companies co ON c.company_id = co.id
        WHERE c.company_id = ?
        ORDER BY c.created_at DESC
      `;
      params = [req.user.company_id];
    } else {
      // Employees can see all campaigns across companies
      query = `
        SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, c.created_at, co.name as company_name
        FROM campaigns c
        JOIN companies co ON c.company_id = co.id
        ORDER BY c.created_at DESC
      `;
      params = [];
    }
    
    const [rows] = await conn.execute(query, params);
    conn.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * POST /api/campaigns - Create a new campaign
 * Requires: Authentication (client or employee role)
 * Body: { name, description, start_date?, end_date?, company_id? }
 * Role-based logic:
 * - Clients: Automatically use their company_id
 * - Employees: Must specify company_id in request body
 */
// CREATE a new campaign (for clients)
app.post('/api/campaigns', authenticateToken, async (req, res) => {
  const { name, description, start_date, end_date } = req.body;
  
  if (!name || !description) {
    return res.status(400).json({ error: 'Campaign name and description are required' });
  }
  
  // Only clients and employees can create campaigns
  if (req.user.role !== 'client' && req.user.role !== 'employee') {
    return res.status(403).json({ error: 'Not authorized to create campaigns' });
  }
  
    try {
    const conn = await pool.getConnection();
    
    // Role-based company assignment
    // For clients, use their company_id; for employees, company_id should be provided in request
    const company_id = req.user.role === 'client' ? req.user.company_id : req.body.company_id;
    
    if (!company_id) {
      conn.release();
      return res.status(400).json({ error: 'Company ID is required' });
    }
    
    // Insert campaign with default 'pending' status
    const [result] = await conn.execute(
      'INSERT INTO campaigns (name, description, company_id, status, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, company_id, 'pending', start_date || null, end_date || null, req.user.id]
    );
    
    // Retrieve the created campaign with company information
    const [campaignRows] = await conn.execute(`
      SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, c.created_at, co.name as company_name
      FROM campaigns c
      JOIN companies co ON c.company_id = co.id
      WHERE c.id = ?
    `, [result.insertId]);
    
    conn.release();
    res.status(201).json(campaignRows[0]);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

/**
 * PUT /api/campaigns/:id - Update campaign details
 * Requires: Authentication + Employee role
 * Params: id (campaign ID)
 * Body: { name?, description?, start_date?, end_date?, company_id? }
 * Only employees can update campaign details
 */
// UPDATE campaign details (for employees)
app.put('/api/campaigns/:id', authenticateToken, authorizeRole('employee'), async (req, res) => {
  const { id } = req.params;
  const { name, description, start_date, end_date, company_id } = req.body;
  
  if (!name || !description) {
    return res.status(400).json({ error: 'Campaign name and description are required' });
  }
  
  try {
    const conn = await pool.getConnection();
    
    // Verify campaign exists
    const [existingCampaign] = await conn.execute('SELECT id FROM campaigns WHERE id = ?', [id]);
    if (existingCampaign.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Update campaign
    const [result] = await conn.execute(
      'UPDATE campaigns SET name = ?, description = ?, start_date = ?, end_date = ?, company_id = ? WHERE id = ?',
      [name, description, start_date || null, end_date || null, company_id, id]
    );
    
    // Retrieve the updated campaign with company information
    const [campaignRows] = await conn.execute(`
      SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, c.created_at, c.company_id, co.name as company_name
      FROM campaigns c
      JOIN companies co ON c.company_id = co.id
      WHERE c.id = ?
    `, [id]);
    
    conn.release();
    res.json(campaignRows[0]);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

/**
 * PUT /api/campaigns/:id/status - Update campaign status
 * Requires: Authentication + Employee role
 * Params: id (campaign ID)
 * Body: { status: enum('pending', 'approved', 'in_progress', 'completed', 'cancelled') }
 * Only employees can change campaign status
 */
// UPDATE campaign status (for employees)
app.put('/api/campaigns/:id/status', authenticateToken, authorizeRole('employee'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Validate status enum values
  if (!status || !['pending', 'approved', 'in_progress', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required (pending, approved, in_progress, completed, cancelled)' });
  }
  
  try {
    const conn = await pool.getConnection();
    const [result] = await conn.execute(
      'UPDATE campaigns SET status = ? WHERE id = ?',
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      conn.release();
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Retrieve the updated campaign with company information
    const [campaignRows] = await conn.execute(`
      SELECT c.id, c.name, c.description, c.status, c.start_date, c.end_date, c.created_at, co.name as company_name
      FROM campaigns c
      JOIN companies co ON c.company_id = co.id
      WHERE c.id = ?
    `, [id]);
    
    conn.release();
    res.json(campaignRows[0]);
  } catch (error) {
    console.error('Error updating campaign status:', error);
    res.status(500).json({ error: 'Failed to update campaign status' });
  }
});

// --- DATABASE CONNECTION TEST ---
/**
 * Test database connectivity on server startup
 * Ensures the application can connect to the database before accepting requests
 */
async function testDatabaseConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to MariaDB database');
    conn.release();
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
}

// --- Start Server ---
/**
 * Server initialization and startup sequence
 * 1. Test database connection
 * 2. Start Express server
 * Uses async/await for proper error handling
 */
async function startServer() {
  try {
    // Test database connection on startup
    await testDatabaseConnection();
    
    // Start Express server on specified port
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server or connect to DB:', error);
    process.exit(1);  // Exit with error code
  }
}

// Execute server startup
startServer();