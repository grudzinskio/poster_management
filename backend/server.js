// server.js
// Main server file for the poster management application backend
// Refactored into a modular architecture

// Environment configuration - dotenv loads environment variables from .env file
require('dotenv').config({ path: '../.env' });

// Core dependencies
const express = require('express');
const cors = require('cors');

// Import configuration and utilities
const { testDatabaseConnection, testKnexConnection } = require('./config/database');
const routes = require('./routes');

// Express.js application instance
const app = express();
const PORT = 3001;

// Middleware configuration
app.use(cors());             // Enable CORS for cross-origin requests from frontend
app.use(express.json());     // Parse JSON request bodies

// Mount all routes
app.use(routes);

// --- Server Startup ---
/**
 * Server initialization and startup sequence
 * 1. Test database connection
 * 2. Start Express server
 * Uses async/await for proper error handling
 */
async function startServer() {
  try {
    // Test both database connections on startup
    await testDatabaseConnection();
    await testKnexConnection();
    
    // Start Express server on specified port
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server or connect to DB:', error);
    process.exit(1);  // Exit with error code
  }
}

// Execute server startup
startServer();
