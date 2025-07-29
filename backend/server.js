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

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'your_database_name',
  port: process.env.DB_PORT || 3306
};

// Database connection pool
let db;

async function connectDB() {
  try {
    db = await mysql.createPool(dbConfig);
    console.log('✅ Connected to MariaDB database');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Initialize database connection
connectDB();

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

    // Find user in database
    const [rows] = await db.execute(
      'SELECT id, username, password, role FROM users WHERE username = ?',
      [username]
    );

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

    // Return success response with user info only
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
      details: error.message // This will help us debug
    });
  }
});

// Get campaigns route (no authentication required)
app.get('/api/campaigns', (req, res) => {
  // In the future, you'll get this data from your database
  const sampleCampaigns = [
    { id: 1, name: 'tests', client: 'Nike' },
    { id: 2, name: 'Back to School', client: 'Adidas' },
  ];
  res.json(sampleCampaigns);
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});