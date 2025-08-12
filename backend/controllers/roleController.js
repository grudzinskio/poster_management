// controllers/roleController.js
// Role management controller - CRUD operations for roles and permissions

const knex = require('../config/knex');

/**
 * GET /api/roles - Retrieve all roles
 */
async function getAllRoles(req, res) {
  try {
    const roles = await knex('roles')
      .where('is_active', true)
      .select('id', 'name', 'description', 'created_at')
      .orderBy('name');
    
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
}

/**
 * GET /api/roles/:id/permissions - Retrieve permissions for a specific role
 */
async function getRolePermissions(req, res) {
  const { id } = req.params;
  
  try {
    const permissions = await knex('role_permissions as rp')
      .join('permissions as p', 'rp.permission_id', 'p.id')
      .where('rp.role_id', id)
      .where('rp.is_active', true)
      .where('p.is_active', true)
      .select('p.id', 'p.name', 'p.description', 'p.resource', 'p.action')
      .orderBy('p.name');
    
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Failed to fetch role permissions' });
  }
}

/**
 * GET /api/permissions - Retrieve all permissions
 */
async function getAllPermissions(req, res) {
  try {
    const permissions = await knex('permissions')
      .where('is_active', true)
      .select('id', 'name', 'description', 'resource', 'action')
      .orderBy('name');
    
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
}

/**
 * POST /api/roles - Create a new role
 */
async function createRole(req, res) {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Role name is required' });
  }
  
  try {
    const [insertId] = await knex('roles').insert({
      name,
      description: description || null
    });
    
    const role = await knex('roles')
      .where('id', insertId)
      .select('id', 'name', 'description', 'created_at')
      .first();
    
    res.status(201).json(role);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Role name already exists' });
    }
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
}

/**
 * PUT /api/roles/:id/permissions - Update role permissions
 */
async function updateRolePermissions(req, res) {
  const { id } = req.params;
  const { permission_ids } = req.body;
  
  if (!Array.isArray(permission_ids)) {
    return res.status(400).json({ error: 'permission_ids must be an array' });
  }
  
  const trx = await knex.transaction();
  
  try {
    // Remove existing permissions for this role
    await trx('role_permissions').where('role_id', id).del();
    
    // Add new permissions
    if (permission_ids.length > 0) {
      const rolePermissions = permission_ids.map(permission_id => ({
        role_id: id,
        permission_id: permission_id
      }));
      
      await trx('role_permissions').insert(rolePermissions);
    }
    
    await trx.commit();
    
    // Return updated permissions
    const permissions = await knex('role_permissions as rp')
      .join('permissions as p', 'rp.permission_id', 'p.id')
      .where('rp.role_id', id)
      .where('rp.is_active', true)
      .where('p.is_active', true)
      .select('p.id', 'p.name', 'p.description', 'p.resource', 'p.action')
      .orderBy('p.name');
    
    res.json(permissions);
  } catch (error) {
    await trx.rollback();
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: 'Failed to update role permissions' });
  }
}

/**
 * PUT /api/roles/:id - Update role information
 */
async function updateRole(req, res) {
  const { id } = req.params;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Role name is required' });
  }
  
  try {
    const affectedRows = await knex('roles')
      .where('id', id)
      .update({
        name,
        description: description || null,
        updated_at: knex.fn.now()
      });
    
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    const role = await knex('roles')
      .where('id', id)
      .select('id', 'name', 'description', 'created_at', 'updated_at')
      .first();
    
    res.json(role);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Role name already exists' });
    }
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
}

/**
 * DELETE /api/roles/:id - Delete a role (soft delete)
 */
async function deleteRole(req, res) {
  const { id } = req.params;
  
  try {
    // Check if role is being used by any users
    const usersWithRole = await knex('user_roles')
      .where('role_id', id)
      .where('is_active', true)
      .count('* as count')
      .first();
    
    if (usersWithRole.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete role that is assigned to users' 
      });
    }
    
    // Soft delete the role
    const affectedRows = await knex('roles')
      .where('id', id)
      .update({ is_active: false, updated_at: knex.fn.now() });
    
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
}

module.exports = {
  getAllRoles,
  getRolePermissions,
  getAllPermissions,
  createRole,
  updateRolePermissions,
  updateRole,
  deleteRole
};
