// config/database.js
// Database configuration and connection pool management

const mysql = require('mysql2/promise');
const knex = require('./knex');

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

/**
 * Test database connectivity
 * Ensures the application can connect to the database before accepting requests
 */
async function testDatabaseConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MariaDB database');
    conn.release();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Test database connectivity using Knex
 */
async function testKnexConnection() {
  try {
    await knex.raw('SELECT 1');
    console.log('Connected to MariaDB database via Knex');
  } catch (error) {
    console.error('Failed to connect to database via Knex:', error);
    throw error;
  }
}

module.exports = {
  pool,
  testDatabaseConnection,
  knex,
  testKnexConnection
};
