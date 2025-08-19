// controllers/rbacController.js
// Example controller demonstrating the new RBAC system

const { getUserById, createUser, assignRole, removeRole } = require('../services/userService');
const { hashPassword } = require('../services/authService');
const knex = require('../config/knex');

/**
 * Get current user's permissions and roles
 * GET /api/rbac/me
 */
async function getMyPermissions(req, res) {
  try {
    const user = req.userInstance;
    
    const roles = await user.getRoles();
    const permissions = await user.getPermissions();
    
    res.json({
      user: user.toJSON(),
      roles: roles,
      permissions: permissions.map(p => ({
        permission: p.permission,
        description: p.description
      }))
    });
  } catch (error) {
    console.error('Error getting user permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Check specific permission for current user
 * POST /api/rbac/check
 * Body: { permission: "permission_name" }
 */
async function checkMyPermission(req, res) {
  try {
    const { permission } = req.body;
    const user = req.userInstance;
    
    if (!permission) {
      return res.status(400).json({ error: 'Permission name is required' });
    }
    
    const hasPermission = await user.can(permission);
    
    res.json({
      permission,
      allowed: hasPermission,
      user: user.username
    });
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get all users (requires view_users permission)
 * GET /api/rbac/users
 */
async function getUsers(req, res) {
  try {
    const users = await knex('users')
      .leftJoin('companies', 'users.company_id', 'companies.id')
      .select('users.id', 'users.username', 'users.email', 'companies.name as company_name')
      .orderBy('users.username');
    
    // Get roles for each user
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const userInstance = await getUserById(user.id);
        const roles = await userInstance.getRoles();
        const roleNames = roles.map(r => r.name);
        
        // Determine user type based on roles
        let userType = 'unknown';
        if (roleNames.includes('employee') || roleNames.includes('super_admin') || roleNames.includes('company_admin')) {
          userType = 'employee';
        } else if (roleNames.includes('client')) {
          userType = 'client';
        } else if (roleNames.includes('contractor')) {
          userType = 'contractor';
        }
        
        return {
          ...user,
          roles: roleNames,
          userType: userType
        };
      })
    );
    
    res.json(usersWithRoles);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create a new user (requires create_user permission)
 * POST /api/rbac/users
 * Body: { username, password, email, company_id?, roles? }
 */
async function createNewUser(req, res) {
  try {
    const { username, password, email, company_id, roles } = req.body;
    
    if (!username || !password || !email) {
      return res.status(400).json({ 
        error: 'Username, password, and email are required' 
      });
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Create the user
    const user = await createUser({
      username,
      password: hashedPassword,
      email,
      company_id: company_id || null
    });
    
    if (!user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }
    
    // Assign roles if provided
    if (roles && Array.isArray(roles)) {
      for (const roleName of roles) {
        const role = await knex('roles').where('name', roleName).first();
        if (role) {
          await assignRole(user.id, role.id);
        }
      }
    }
    
    // Get the created user with roles
    const createdUser = await getUserById(user.id);
    const userRoles = await createdUser.getRoles();
    
    res.status(201).json({
      user: createdUser.toJSON(),
      roles: userRoles.map(r => r.name),
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Assign role to user (requires manage_roles permission)
 * POST /api/rbac/users/:userId/roles
 * Body: { role: "role_name" }
 */
async function assignUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ error: 'Role name is required' });
    }
    
    // Get role ID
    const roleRecord = await knex('roles').where('name', role).first();
    if (!roleRecord) {
      return res.status(400).json({ error: 'Role not found' });
    }
    
    // Assign role
    const result = await assignRole(parseInt(userId), roleRecord.id);
    if (result === true) {
      res.json({ message: `Role ${role} assigned to user successfully` });
    } else if (result === 'already_assigned') {
      res.status(400).json({ error: 'Role already assigned to user' });
    } else {
      res.status(400).json({ error: 'Failed to assign role' });
    }
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Remove role from user (requires manage_roles permission)
 * DELETE /api/rbac/users/:userId/roles/:role
 */
async function removeUserRole(req, res) {
  try {
    const { userId, role } = req.params;
    
    // Get role ID
    const roleRecord = await knex('roles').where('name', role).first();
    if (!roleRecord) {
      return res.status(400).json({ error: 'Role not found' });
    }
    
    // Remove role
    const success = await removeRole(parseInt(userId), roleRecord.id);
    
    if (success) {
      res.json({ message: `Role ${role} removed from user successfully` });
    } else {
      res.status(400).json({ error: 'Failed to remove role' });
    }
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get all roles and permissions (requires view_users permission)
 * GET /api/rbac/roles
 */
async function getRolesAndPermissions(req, res) {
  try {
    const roles = await knex('roles')
      .select('id', 'name', 'description')
      .orderBy('name');
    
    const permissions = await knex('permissions')
      .select('id', 'permission', 'description')
      .orderBy('permission');
    
    // Get role-permission mappings
    const rolePermissions = await knex('role_permissions as rp')
      .join('roles as r', 'rp.role', 'r.id')
      .join('permissions as p', 'rp.permission', 'p.id')
      .select('r.name as role_name', 'p.permission as permission_name');
    
    // Group permissions by role
    const rolesWithPermissions = roles.map(role => ({
      ...role,
      permissions: rolePermissions
        .filter(rp => rp.role_name === role.name)
        .map(rp => rp.permission_name)
    }));
    
    res.json({
      roles: rolesWithPermissions,
      permissions
    });
  } catch (error) {
    console.error('Error getting roles and permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getMyPermissions,
  checkMyPermission,
  getUsers,
  createNewUser,
  assignUserRole,
  removeUserRole,
  getRolesAndPermissions
};
