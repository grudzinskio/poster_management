// controllers/roleController.js
// Role management controller - CRUD operations for roles and permissions
// Updated for 4-table RBAC structure (no separate roles/permissions tables)

const knex = require('../config/knex');

/**
 * GET /api/roles - Retrieve all unique role names
 */
async function getAllRoles(req, res) {
  try {
    // Get all unique role names from user_roles table
    const roleNames = await knex('user_roles')
      .distinct('role_name')
      .where('is_active', true)
      .select('role_name as name')
      .orderBy('role_name');
    
    // Get user count for each role
    const rolesWithCounts = await Promise.all(
      roleNames.map(async (role) => {
        const userCount = await knex('user_roles')
          .where('role_name', role.name)
          .where('is_active', true)
          .count('* as count')
          .first();
        
        const permissionCount = await knex('role_permissions')
          .where('role_name', role.name)
          .where('is_active', true)
          .count('* as count')
          .first();
        
        return {
          name: role.name,
          user_count: parseInt(userCount.count),
          permission_count: parseInt(permissionCount.count)
        };
      })
    );
    
    res.json(rolesWithCounts);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
}

/**
 * GET /api/roles/:roleName/permissions - Retrieve permissions for a specific role
 */
async function getRolePermissions(req, res) {
  const { roleName } = req.params;
  
  try {
    const permissions = await knex('role_permissions')
      .where('role_name', roleName)
      .where('is_active', true)
      .select('permission_name as name', 'assigned_at')
      .orderBy('permission_name');
    
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
}

/**
 * POST /api/roles - Create a new role by assigning it to a user
 * Note: In the new structure, roles are created implicitly when assigned
 */
async function createRole(req, res) {
  const { role_name, user_id, permissions = [] } = req.body;
  
  if (!role_name) {
    return res.status(400).json({ error: 'Role name is required' });
  }
  
  const trx = await knex.transaction();
  
  try {
    // If user_id is provided, assign the role to that user
    if (user_id) {
      await trx('user_roles').insert({
        user_id,
        role_name,
        is_active: true
      });
    }
    
    // Add permissions to the role if provided
    if (permissions.length > 0) {
      const rolePermissions = permissions.map(permission_name => ({
        role_name,
        permission_name,
        is_active: true
      }));
      
      await trx('role_permissions').insert(rolePermissions);
    }
    
    await trx.commit();
    
    // Return the created role info
    const userCount = await knex('user_roles')
      .where('role_name', role_name)
      .where('is_active', true)
      .count('* as count')
      .first();
    
    const permissionCount = await knex('role_permissions')
      .where('role_name', role_name)
      .where('is_active', true)
      .count('* as count')
      .first();
    
    res.status(201).json({
      name: role_name,
      user_count: parseInt(userCount.count),
      permission_count: parseInt(permissionCount.count)
    });
  } catch (error) {
    await trx.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Role assignment already exists' });
    }
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
}

/**
 * PUT /api/roles/:roleName/permissions - Update role permissions
 */
async function updateRolePermissions(req, res) {
  const { roleName } = req.params;
  const { permission_names } = req.body;
  
  if (!Array.isArray(permission_names)) {
    return res.status(400).json({ error: 'permission_names must be an array' });
  }
  
  const trx = await knex.transaction();
  
  try {
    // Remove existing permissions for this role
    await trx('role_permissions').where('role_name', roleName).del();
    
    // Add new permissions
    if (permission_names.length > 0) {
      const rolePermissions = permission_names.map(permission_name => ({
        role_name: roleName,
        permission_name,
        is_active: true
      }));
      
      await trx('role_permissions').insert(rolePermissions);
    }
    
    await trx.commit();
    
    // Return updated permissions
    const permissions = await knex('role_permissions')
      .where('role_name', roleName)
      .where('is_active', true)
      .select('permission_name as name', 'assigned_at')
      .orderBy('permission_name');
    
    res.json(permissions);
  } catch (error) {
    await trx.rollback();
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
}

/**
 * DELETE /api/roles/:roleName - Delete a role (remove all assignments)
 */
async function deleteRole(req, res) {
  const { roleName } = req.params;
  
  const trx = await knex.transaction();
  
  try {
    // Remove all user assignments for this role
    const userRolesDeletions = await trx('user_roles')
      .where('role_name', roleName)
      .del();
    
    // Remove all permission assignments for this role
    const rolePermissionsDeletions = await trx('role_permissions')
      .where('role_name', roleName)
      .del();
    
    await trx.commit();
    
    if (userRolesDeletions === 0 && rolePermissionsDeletions === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    res.json({ 
      message: `Role '${roleName}' deleted successfully`,
      user_assignments_removed: userRolesDeletions,
      permission_assignments_removed: rolePermissionsDeletions
    });
  } catch (error) {
    await trx.rollback();
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
}

/**
 * GET /api/permissions - Retrieve all unique permissions from permission_functions table
 * Updated for new 4-table RBAC structure where permissions are stored as strings
 */
async function getAllPermissions(req, res) {
  try {
    // Get all unique permission names from the permission_functions table
    const permissions = await knex('permission_functions')
      .distinct('permission_name')
      .where('is_active', true)
      .select('permission_name as name')
      .orderBy('permission_name');
    
    // Include function count for each permission
    const permissionsWithFunctions = await Promise.all(
      permissions.map(async (permission) => {
        const functions = await knex('permission_functions')
          .where('permission_name', permission.name)
          .where('is_active', true)
          .select('function_name', 'description', 'module')
          .orderBy('function_name');
        
        return {
          name: permission.name,
          function_count: functions.length,
          functions: functions
        };
      })
    );
    
    res.json(permissionsWithFunctions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
}

module.exports = {
  getAllRoles,
  getRolePermissions,
  createRole,
  updateRolePermissions,
  deleteRole,
  getAllPermissions
};
