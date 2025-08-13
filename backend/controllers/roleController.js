// controllers/roleController.js
// Role management controller - CRUD operations for roles and permissions
// Updated for simplified 5-table RBAC structure

const knex = require('../config/knex');

/**
 * GET /api/roles - Retrieve all roles
 */
async function getAllRoles(req, res) {
  try {
    // Get all roles from the roles table
    const roles = await knex('roles')
      .select('id', 'name', 'description')
      .orderBy('name');
    
    // Get user count for each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await knex('user_roles')
          .where('role', role.id)
          .count('* as count')
          .first();
        
        const permissionCount = await knex('role_permissions')
          .where('role', role.id)
          .count('* as count')
          .first();
        
        return {
          id: role.id,
          name: role.name,
          description: role.description,
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
 * GET /api/roles/:roleId/permissions - Retrieve permissions for a specific role
 */
async function getRolePermissions(req, res) {
  const { roleName } = req.params;
  
  console.log('getRolePermissions called with roleName:', roleName, 'type:', typeof roleName);
  
  if (!roleName) {
    return res.status(400).json({ error: 'Role name is required' });
  }
  
  try {
    // First, get the role ID from the role name
    const role = await knex('roles').where('name', roleName).first();
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    console.log('Found role:', role);
    
    const permissions = await knex('role_permissions as rp')
      .join('permissions as p', 'rp.permission', 'p.id')
      .where('rp.role', '=', role.id)
      .select('p.id', 'p.permission', 'p.description')
      .orderBy('p.permission');
    
    console.log('Found permissions for role', roleName, ':', permissions.length);
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
}

/**
 * POST /api/roles - Create a new role
 */
async function createRole(req, res) {
  const { name, description, permissions = [] } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Role name is required' });
  }
  
  const trx = await knex.transaction();
  
  try {
    // Create the role
    const [roleId] = await trx('roles').insert({
      name,
      description: description || null
    });
    
    // Add permissions to the role if provided
    if (permissions.length > 0) {
      // Get permission IDs
      const permissionRecords = await trx('permissions')
        .whereIn('permission', permissions)
        .select('id', 'permission');
      
      if (permissionRecords.length !== permissions.length) {
        await trx.rollback();
        return res.status(400).json({ error: 'One or more invalid permissions provided' });
      }
      
      const rolePermissions = permissionRecords.map(perm => ({
        role: roleId,
        permission: perm.id
      }));
      
      await trx('role_permissions').insert(rolePermissions);
    }
    
    await trx.commit();
    
    // Return the created role info
    const userCount = await knex('user_roles')
      .where('role', roleId)
      .count('* as count')
      .first();
    
    const permissionCount = await knex('role_permissions')
      .where('role', roleId)
      .count('* as count')
      .first();
    
    res.status(201).json({
      id: roleId,
      name,
      description,
      user_count: parseInt(userCount.count),
      permission_count: parseInt(permissionCount.count)
    });
  } catch (error) {
    await trx.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Role name already exists' });
    }
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
}

/**
 * PUT /api/roles/:roleId/permissions - Update role permissions
 */
async function updateRolePermissions(req, res) {
  const { roleName } = req.params;
  const { permissions } = req.body;
  
  console.log('updateRolePermissions called with roleName:', roleName, 'permissions:', permissions);
  
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: 'permissions must be an array' });
  }
  
  const trx = await knex.transaction();
  
  try {
    // First, get the role ID from the role name
    const role = await trx('roles').where('name', roleName).first();
    
    if (!role) {
      await trx.rollback();
      return res.status(404).json({ error: 'Role not found' });
    }
    
    const roleId = role.id;
    console.log('Found role ID:', roleId, 'for role:', roleName);
    
    // Remove existing permissions for this role
    await trx('role_permissions').where('role', roleId).del();
    
    // Add new permissions
    if (permissions.length > 0) {
      // Get permission IDs
      const permissionRecords = await trx('permissions')
        .whereIn('permission', permissions)
        .select('id', 'permission');
      
      console.log('Found permission records:', permissionRecords);
      
      if (permissionRecords.length !== permissions.length) {
        await trx.rollback();
        return res.status(400).json({ error: 'One or more invalid permissions provided' });
      }
      
      const rolePermissions = permissionRecords.map(perm => ({
        role: roleId,
        permission: perm.id
      }));
      
      await trx('role_permissions').insert(rolePermissions);
    }
    
    await trx.commit();
    
    // Return updated permissions
    const updatedPermissions = await knex('role_permissions as rp')
      .join('permissions as p', 'rp.permission', 'p.id')
      .where('rp.role', roleId)
      .select('p.id', 'p.permission', 'p.description')
      .orderBy('p.permission');
    
    console.log('Updated permissions result:', updatedPermissions);
    res.json(updatedPermissions);
  } catch (error) {
    await trx.rollback();
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
}

/**
 * DELETE /api/roles/:roleId - Delete a role (remove all assignments)
 */
async function deleteRole(req, res) {
  const { roleId } = req.params;
  
  const trx = await knex.transaction();
  
  try {
    // Remove all user assignments for this role
    const userRolesDeletions = await trx('user_roles')
      .where('role', roleId)
      .del();
    
    // Remove all permission assignments for this role
    const rolePermissionsDeletions = await trx('role_permissions')
      .where('role', roleId)
      .del();
    
    // Delete the role itself
    const roleDeletion = await trx('roles')
      .where('id', roleId)
      .del();
    
    await trx.commit();
    
    if (roleDeletion === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    res.json({ 
      message: `Role deleted successfully`,
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
 * GET /api/permissions - Get all available permissions
 */
async function getAllPermissions(req, res) {
  try {
    const permissions = await knex('permissions')
      .select('id', 'permission', 'description')
      .orderBy('permission');
    
    res.json(permissions);
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
