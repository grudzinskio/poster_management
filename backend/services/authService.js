// services/authService.js
// Authentication-related services including password hashing and JWT operations

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @param {number} saltRounds - Number of salt rounds (default: 12)
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password, saltRounds = 12) {
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} - True if passwords match
 */
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Check if a password is already hashed (bcrypt format)
 * @param {string} password - Password to check
 * @returns {boolean} - True if password is already hashed
 */
function isPasswordHashed(password) {
  return password.length === 60 && password.startsWith('$2');
}

/**
 * Generate JWT token
 * @param {Object} payload - User information to encode in token
 * @param {string} expiresIn - Token expiration time (default: '1h')
 * @returns {string} - JWT token
 */
function generateToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  isPasswordHashed,
  generateToken,
  verifyToken
};
