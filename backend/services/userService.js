// services/userService.js
// User-related services including the enhanced User class with permission checking

const knex = require('../config/knex');
const { can, getUserRoles, getUserPermissions, hasRole } = require('./authService');

/**
 * Enhanced User class with permission checking capabilities
 */
class User {
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.user_type = userData.user_type;
    this.company_id = userData.company_id;
    this.company_name = userData.company_name;
    this._roles = null;
    this._permissions = null;
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission name (e.g., 'edit_user')
   * @returns {Promise<boolean>} - True if user has permission
   */
  async can(permission) {
    return await can(this.id, permission);
  }

  /**
   * Check if user has specific role
   * @param {string} roleName - Role name
   * @returns {Promise<boolean>} - True if user has role
   */
  async hasRole(roleName) {
    return await hasRole(this.id, roleName);
  }

  /**
   * Get user roles (cached)
   * @returns {Promise<Array>} - Array of role objects
   */
  async getRoles() {
    if (!this._roles) {
      this._roles = await getUserRoles(this.id);
    }
    return this._roles;
  }

  /**
   * Get user permissions (cached)
   * @returns {Promise<Array>} - Array of permission objects
   */
  async getPermissions() {
    if (!this._permissions) {
      this._permissions = await getUserPermissions(this.id);
    }
    return this._permissions;
  }

  /**
   * Get role names as array
   * @returns {Promise<Array>} - Array of role name strings
   */
  async getRoleNames() {
    const roles = await this.getRoles();
    return roles.map(role => role.name);
  }

  /**
   * Get permission names as array
   * @returns {Promise<Array>} - Array of permission name strings
   */
  async getPermissionNames() {
    const permissions = await this.getPermissions();
    return permissions.map(perm => perm.permission);
  }

  /**
   * Check multiple permissions at once
   * @param {Array<string>} permissions - Array of permission names
   * @returns {Promise<Object>} - Object with permission names as keys and boolean values
   */
  async canMultiple(permissions) {
    const results = {};
    for (const permission of permissions) {
      results[permission] = await this.can(permission);
    }
    return results;
  }

  /**
   * Check if user can perform any of the given permissions
   * @param {Array<string>} permissions - Array of permission names
   * @returns {Promise<boolean>} - True if user has any of the permissions
   */
  async canAny(permissions) {
    for (const permission of permissions) {
      if (await this.can(permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user can perform all of the given permissions
   * @param {Array<string>} permissions - Array of permission names
   * @returns {Promise<boolean>} - True if user has all permissions
   */
  async canAll(permissions) {
    for (const permission of permissions) {
      if (!(await this.can(permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Refresh cached roles and permissions
   */
  refreshCache() {
    this._roles = null;
    this._permissions = null;
  }

  /**
   * Convert to plain object for JSON responses
   */
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      user_type: this.user_type,
      company_id: this.company_id,
      company_name: this.company_name
    };
  }
}

/**
 * Get user by ID with enhanced User instance
 * @param {number} userId - User ID
 * @returns {Promise<User|null>} - User instance or null if not found
 */
async function getUserById(userId) {
  try {
    const userData = await knex('users')
      .leftJoin('companies', 'users.company_id', 'companies.id')
      .select('users.*', 'companies.name as company_name')
      .where('users.id', userId)
      .first();

    if (!userData) {
      return null;
    }

    return new User(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Get user by username with enhanced User instance
 * @param {string} username - Username
 * @returns {Promise<User|null>} - User instance or null if not found
 */
async function getUserByUsername(username) {
  try {
    const userData = await knex('users')
      .leftJoin('companies', 'users.company_id', 'companies.id')
      .select('users.*', 'companies.name as company_name')
      .where('users.username', username)
      .first();

    if (!userData) {
      return null;
    }

    return new User(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<User|null>} - Created user instance
 */
async function createUser(userData) {
  try {
    const [userId] = await knex('users').insert(userData).returning('id');
    return await getUserById(userId.id || userId);
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

/**
 * Update user
 * @param {number} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<User|null>} - Updated user instance
 */
async function updateUser(userId, updateData) {
  try {
    await knex('users').where('id', userId).update(updateData);
    return await getUserById(userId);
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

/**
 * Assign role to user
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {Promise<boolean>} - Success status
 */

async function assignRole(userId, roleId) {
  try {
    // Check if role already assigned
    const exists = await knex('user_roles')
      .where({ user: userId, role: roleId })
      .first();
    if (exists) {
      // Role already assigned
      return 'already_assigned';
    }
    await knex('user_roles').insert({
      user: userId,
      role: roleId
    });
    return true;
  } catch (error) {
    console.error('Error assigning role:', error);
    return false;
  }
}

/**
 * Remove role from user
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {Promise<boolean>} - Success status
 */
async function removeRole(userId, roleId) {
  try {
    await knex('user_roles')
      .where('user', userId)
      .where('role', roleId)
      .del();
    return true;
  } catch (error) {
    console.error('Error removing role:', error);
    return false;
  }
}

module.exports = {
  User,
  getUserById,
  getUserByUsername,
  createUser,
  updateUser,
  assignRole,
  removeRole
};
