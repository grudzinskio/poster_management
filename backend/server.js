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

// Export the Express app for testing and external startup
module.exports = app;
