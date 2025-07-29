// backend/server.js

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);


// --- API Routes ---

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt:', { username, passwordProvided: !!password });

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // ✅ **FIX**: Declare 'rows' here so it's accessible throughout the function
    let rows = []; 
    const conn = await pool.getConnection();
    try {
      // Find user by username first
      [rows] = await conn.execute(
        'SELECT id, username, password, role FROM users WHERE username = ?',
        [username]
      );
    } finally {
      // Always release the connection
      conn.release();
    }

    console.log('Database query result:', rows.length > 0 ? 'User found' : 'User not found');

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];

    // Compare passwords directly (no hashing)
    const isValidPassword = password === user.password;
    console.log('Password validation:', isValidPassword ? 'Success' : 'Failed');

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Return success response with user info
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error details:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get campaigns route (no authentication required)
app.get('/api/campaigns', (req, res) => {
  const sampleCampaigns = [
    { id: 1, name: 'tests', client: 'Nike' },
    { id: 2, name: 'Back to School', client: 'Adidas' },
  ];
  res.json(sampleCampaigns);
});


// --- Start Server ---
async function startServer() {
  try {
    // Test the database connection on startup
    const connection = await pool.getConnection();
    console.log('✅ Connected to MariaDB database');
    connection.release();
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server or connect to DB:', error);
    process.exit(1);
  }
}

startServer();