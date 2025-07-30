// backend/server.js
require('dotenv').config({ path: '../.env' });
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('Database:', process.env.DB_NAME);
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken'); // <-- Still need JWT


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
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// --- AUTHENTICATION MIDDLEWARE ---

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Not authorized for this action' });
    }
    next();
  };
};

// --- API Routes ---

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
      'SELECT id, username, password, role FROM users WHERE username = ?',
      [username]
    );
    conn.release();

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];

    // Plaintext password comparison
    const isValidPassword = password === user.password;

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const userPayload = { id: user.id, username: user.username, role: user.role };
    const accessToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

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

// --- USER MANAGEMENT ROUTES (FOR EMPLOYEES) ---

// GET all users
app.get('/api/users', authenticateToken, authorizeRole('employee'), async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.execute('SELECT id, username, role FROM users');
        conn.release();
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// CREATE a new user
app.post('/api/users', authenticateToken, authorizeRole('employee'), async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'Username, password, and role are required' });
    }
    
    try {
        const conn = await pool.getConnection();
        // Storing plaintext password
        const [result] = await conn.execute(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, password, role]
        );
        conn.release();
        
        res.status(201).json({ id: result.insertId, username, role });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// DELETE a user
app.delete('/api/users/:id', authenticateToken, authorizeRole('employee'), async (req, res) => {
    const { id } = req.params;
    if (parseInt(id, 10) === req.user.id) {
        return res.status(400).json({ error: "You cannot delete your own account."});
    }

    try {
        const conn = await pool.getConnection();
        const [result] = await conn.execute('DELETE FROM users WHERE id = ?', [id]);
        conn.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get campaigns route
app.get('/api/campaigns', authenticateToken, (req, res) => {
  const sampleCampaigns = [
    { id: 1, name: 'tests', client: 'Nike' },
    { id: 2, name: 'Back to School', client: 'Adidas' },
  ];
  res.json(sampleCampaigns);
});

// --- Start Server ---
async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MariaDB database');
    connection.release();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server or connect to DB:', error);
    process.exit(1);
  }
}

startServer();