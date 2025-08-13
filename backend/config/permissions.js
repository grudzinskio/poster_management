// Dynamic permission loader - reads from database instead of hardcoding
// Single source of truth: the database

const knex = require('./knex');

// Cache for permissions and roles to avoid repeated DB calls
let permissionsCache = null;
let rolesCache = null;
let cacheExpiry = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get all permissions from database with caching
 */
async function getAllPermissions() {
  if (permissionsCache && cacheExpiry && Date.now() < cacheExpiry) {
    return permissionsCache;
  }
  
  try {
    const permissions = await knex('permissions').select('*');
    permissionsCache = permissions;
    cacheExpiry = Date.now() + CACHE_DURATION;
    return permissions;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
}

/**
 * Get all roles from database with caching
 */
async function getAllRoles() {
  if (rolesCache && cacheExpiry && Date.now() < cacheExpiry) {
    return rolesCache;
  }
  
  try {
    const roles = await knex('roles').select('*');
    rolesCache = roles;
    cacheExpiry = Date.now() + CACHE_DURATION;
    return roles;
  } catch (error) {
    console.error('Error fetching roles:', error);
    return [];
  }
}

/**
 * Get permissions for a specific role from database
 */
async function getPermissionsForRole(roleName) {
  try {
    const permissions = await knex('user_roles as ur')
      .join('roles as r', 'ur.role', 'r.id')
      .join('role_permissions as rp', 'r.id', 'rp.role')
      .join('permissions as p', 'rp.permission', 'p.id')
      .where('r.name', roleName)
      .select('p.permission')
      .distinct();
    
    return permissions.map(p => p.permission);
  } catch (error) {
    console.error('Error fetching permissions for role:', error);
    return [];
  }
}

/**
 * Clear cache (useful for testing or when permissions change)
 */
function clearCache() {
  permissionsCache = null;
  rolesCache = null;
  cacheExpiry = null;
}

// Export only the functions - no hardcoded data
module.exports = {
  getAllPermissions,
  getAllRoles,
  getPermissionsForRole,
  clearCache
};
