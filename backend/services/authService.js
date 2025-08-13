// services/authService.js
// Authentication-related services including password hashing and JWT operations

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('../config/knex');

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

/**
 * Get user permissions based on their roles
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of permission objects
 */
async function getUserPermissions(userId) {
  try {
    const permissions = await knex('user_roles as ur')
      .join('roles as r', 'ur.role', 'r.id')
      .join('role_permissions as rp', 'r.id', 'rp.role')
      .join('permissions as p', 'rp.permission', 'p.id')
      .where('ur.user', userId)
      .select('p.permission', 'p.description', 'r.name as role_name')
      .distinct();

    return permissions;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

/**
 * Get user roles
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of role objects
 */
async function getUserRoles(userId) {
  try {
    const roles = await knex('user_roles as ur')
      .join('roles as r', 'ur.role', 'r.id')
      .where('ur.user', userId)
      .select('r.id', 'r.name', 'r.description')
      .distinct();

    return roles;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
}

/**
 * Check if user has specific permission (can method)
 * @param {number} userId - User ID
 * @param {string} permissionName - Permission name (e.g., 'edit_user')
 * @returns {Promise<boolean>} - True if user has permission
 */
async function can(userId, permissionName) {
  try {
    const permission = await knex('user_roles as ur')
      .join('roles as r', 'ur.role', 'r.id')
      .join('role_permissions as rp', 'r.id', 'rp.role')
      .join('permissions as p', 'rp.permission', 'p.id')
      .where('ur.user', userId)
      .where('p.permission', permissionName)
      .first();

    return !!permission;
  } catch (error) {
    console.error('Error checking user permission:', error);
    return false;
  }
}

/**
 * Check if user has specific permission (alias for can method)
 * @param {number} userId - User ID
 * @param {string} permissionName - Permission name
 * @returns {Promise<boolean>} - True if user has permission
 */
async function hasPermission(userId, permissionName) {
  return await can(userId, permissionName);
}

/**
 * Check if user has specific role
 * @param {number} userId - User ID
 * @param {string} roleName - Role name
 * @returns {Promise<boolean>} - True if user has role
 */
async function hasRole(userId, roleName) {
  try {
    const role = await knex('user_roles as ur')
      .join('roles as r', 'ur.role', 'r.id')
      .where('ur.user', userId)
      .where('r.name', roleName)
      .first();

    return !!role;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  isPasswordHashed,
  generateToken,
  verifyToken,
  getUserPermissions,
  getUserRoles,
  can,
  hasPermission,
  hasRole
};
