const knex = require('../config/knex');

async function runSeeds() {
  try {
    console.log('Running RBAC seed...');
    
    // Clear existing entries
    await knex('permission_permission_functions').del();
    await knex('role_permissions').del();
    await knex('user_roles').del();
    await knex('permission_functions').del();
    await knex('permissions').del();
    await knex('roles').del();
    console.log('✓ Cleared existing RBAC data');

    // Insert roles
    const roleIds = await knex('roles').insert([
      { name: 'employee', description: 'Internal company employee with administrative privileges' },
      { name: 'client', description: 'Client who can manage campaigns and view reports' },
      { name: 'contractor', description: 'External contractor who can work on assigned campaigns' }
    ]);
    console.log('✓ Inserted roles');

    // Insert permission functions
    const functionIds = await knex('permission_functions').insert([
      // User management functions
      { function_name: 'getAllUsers', description: 'Retrieve all users', module: 'userController' },
      { function_name: 'createUser', description: 'Create new user', module: 'userController' },
      { function_name: 'updateUser', description: 'Update user information', module: 'userController' },
      { function_name: 'updateUserPassword', description: 'Update user password', module: 'userController' },
      { function_name: 'deleteUser', description: 'Delete user', module: 'userController' },
      
      // Company management functions
      { function_name: 'getAllCompanies', description: 'Retrieve all companies', module: 'companyController' },
      { function_name: 'createCompany', description: 'Create new company', module: 'companyController' },
      { function_name: 'updateCompany', description: 'Update company information', module: 'companyController' },
      { function_name: 'deleteCompany', description: 'Delete company', module: 'companyController' },
      
      // Campaign management functions
      { function_name: 'getAllCampaigns', description: 'Retrieve all campaigns', module: 'campaignController' },
      { function_name: 'getCampaignById', description: 'Retrieve specific campaign', module: 'campaignController' },
      { function_name: 'createCampaign', description: 'Create new campaign', module: 'campaignController' },
      { function_name: 'updateCampaign', description: 'Update campaign information', module: 'campaignController' },
      { function_name: 'deleteCampaign', description: 'Delete campaign', module: 'campaignController' },
      { function_name: 'assignContractor', description: 'Assign contractor to campaign', module: 'campaignController' },
      { function_name: 'unassignContractor', description: 'Remove contractor from campaign', module: 'campaignController' },
      
      // Campaign image functions
      { function_name: 'uploadCampaignImage', description: 'Upload campaign image', module: 'campaignController' },
      { function_name: 'reviewCampaignImage', description: 'Review and approve/reject campaign image', module: 'campaignController' },
      { function_name: 'getCampaignImages', description: 'Retrieve campaign images', module: 'campaignController' },
      { function_name: 'deleteCampaignImage', description: 'Delete campaign image', module: 'campaignController' },
      
      // Role management functions
      { function_name: 'getAllRoles', description: 'Retrieve all roles', module: 'roleController' },
      { function_name: 'getAllPermissions', description: 'Retrieve all permissions', module: 'roleController' },
      { function_name: 'createRole', description: 'Create new role', module: 'roleController' },
      { function_name: 'updateRole', description: 'Update role information', module: 'roleController' },
      { function_name: 'deleteRole', description: 'Delete role', module: 'roleController' },
      
      // Utility functions
      { function_name: 'migratePasswords', description: 'Migrate plaintext passwords to hashed', module: 'authController' }
    ]);
    console.log('✓ Inserted permission functions');

    // Insert permissions
    const permissionIds = await knex('permissions').insert([
      // User management permissions
      { name: 'users.read', description: 'Read user information', resource: 'users', action: 'read' },
      { name: 'users.create', description: 'Create new users', resource: 'users', action: 'create' },
      { name: 'users.update', description: 'Update user information', resource: 'users', action: 'update' },
      { name: 'users.delete', description: 'Delete users', resource: 'users', action: 'delete' },
      
      // Company management permissions
      { name: 'companies.read', description: 'Read company information', resource: 'companies', action: 'read' },
      { name: 'companies.create', description: 'Create new companies', resource: 'companies', action: 'create' },
      { name: 'companies.update', description: 'Update company information', resource: 'companies', action: 'update' },
      { name: 'companies.delete', description: 'Delete companies', resource: 'companies', action: 'delete' },
      
      // Campaign management permissions
      { name: 'campaigns.read', description: 'Read campaign information', resource: 'campaigns', action: 'read' },
      { name: 'campaigns.create', description: 'Create new campaigns', resource: 'campaigns', action: 'create' },
      { name: 'campaigns.update', description: 'Update campaign information', resource: 'campaigns', action: 'update' },
      { name: 'campaigns.delete', description: 'Delete campaigns', resource: 'campaigns', action: 'delete' },
      { name: 'campaigns.assign', description: 'Assign contractors to campaigns', resource: 'campaigns', action: 'assign' },
      
      // Campaign image permissions
      { name: 'campaign_images.read', description: 'Read campaign images', resource: 'campaign_images', action: 'read' },
      { name: 'campaign_images.upload', description: 'Upload campaign images', resource: 'campaign_images', action: 'upload' },
      { name: 'campaign_images.review', description: 'Review campaign images', resource: 'campaign_images', action: 'review' },
      { name: 'campaign_images.delete', description: 'Delete campaign images', resource: 'campaign_images', action: 'delete' },
      
      // Role management permissions
      { name: 'roles.read', description: 'Read roles and permissions', resource: 'roles', action: 'read' },
      { name: 'roles.create', description: 'Create new roles', resource: 'roles', action: 'create' },
      { name: 'roles.update', description: 'Update roles and permissions', resource: 'roles', action: 'update' },
      { name: 'roles.delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
      
      // Utility permissions
      { name: 'utilities.migrate_passwords', description: 'Migrate passwords utility', resource: 'utilities', action: 'migrate_passwords' }
    ]);
    console.log('✓ Inserted permissions');

    // Get IDs for mapping (since we need to reference them)
    const roles = await knex('roles').select('id', 'name');
    const permissions = await knex('permissions').select('id', 'name');
    const functions = await knex('permission_functions').select('id', 'function_name');

    // Helper function to get ID by name
    const getRoleId = (name) => roles.find(r => r.name === name).id;
    const getPermissionId = (name) => permissions.find(p => p.name === name).id;
    const getFunctionId = (name) => functions.find(f => f.function_name === name).id;

    // Assign permissions to roles
    await knex('role_permissions').insert([
      // Employee role - full access to everything
      { role_id: getRoleId('employee'), permission_id: getPermissionId('users.read') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('users.create') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('users.update') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('users.delete') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('companies.read') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('companies.create') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('companies.update') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('companies.delete') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('campaigns.read') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('campaigns.create') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('campaigns.update') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('campaigns.delete') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('campaigns.assign') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('campaign_images.read') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('campaign_images.upload') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('campaign_images.review') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('campaign_images.delete') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('roles.read') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('roles.create') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('roles.update') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('roles.delete') },
      { role_id: getRoleId('employee'), permission_id: getPermissionId('utilities.migrate_passwords') },

      // Client role - can manage campaigns and images for their company
      { role_id: getRoleId('client'), permission_id: getPermissionId('campaigns.read') },
      { role_id: getRoleId('client'), permission_id: getPermissionId('campaigns.create') },
      { role_id: getRoleId('client'), permission_id: getPermissionId('campaigns.update') },
      { role_id: getRoleId('client'), permission_id: getPermissionId('campaign_images.read') },
      { role_id: getRoleId('client'), permission_id: getPermissionId('campaign_images.upload') },
      { role_id: getRoleId('client'), permission_id: getPermissionId('campaign_images.review') },

      // Contractor role - can work on assigned campaigns and upload images
      { role_id: getRoleId('contractor'), permission_id: getPermissionId('campaigns.read') },
      { role_id: getRoleId('contractor'), permission_id: getPermissionId('campaign_images.read') },
      { role_id: getRoleId('contractor'), permission_id: getPermissionId('campaign_images.upload') }
    ]);
    console.log('✓ Assigned permissions to roles');

    // Assign functions to permissions
    await knex('permission_permission_functions').insert([
      // User permissions to functions
      { permission_id: getPermissionId('users.read'), permission_function_id: getFunctionId('getAllUsers') },
      { permission_id: getPermissionId('users.create'), permission_function_id: getFunctionId('createUser') },
      { permission_id: getPermissionId('users.update'), permission_function_id: getFunctionId('updateUser') },
      { permission_id: getPermissionId('users.update'), permission_function_id: getFunctionId('updateUserPassword') },
      { permission_id: getPermissionId('users.delete'), permission_function_id: getFunctionId('deleteUser') },

      // Company permissions to functions
      { permission_id: getPermissionId('companies.read'), permission_function_id: getFunctionId('getAllCompanies') },
      { permission_id: getPermissionId('companies.create'), permission_function_id: getFunctionId('createCompany') },
      { permission_id: getPermissionId('companies.update'), permission_function_id: getFunctionId('updateCompany') },
      { permission_id: getPermissionId('companies.delete'), permission_function_id: getFunctionId('deleteCompany') },

      // Campaign permissions to functions
      { permission_id: getPermissionId('campaigns.read'), permission_function_id: getFunctionId('getAllCampaigns') },
      { permission_id: getPermissionId('campaigns.read'), permission_function_id: getFunctionId('getCampaignById') },
      { permission_id: getPermissionId('campaigns.create'), permission_function_id: getFunctionId('createCampaign') },
      { permission_id: getPermissionId('campaigns.update'), permission_function_id: getFunctionId('updateCampaign') },
      { permission_id: getPermissionId('campaigns.delete'), permission_function_id: getFunctionId('deleteCampaign') },
      { permission_id: getPermissionId('campaigns.assign'), permission_function_id: getFunctionId('assignContractor') },
      { permission_id: getPermissionId('campaigns.assign'), permission_function_id: getFunctionId('unassignContractor') },

      // Campaign image permissions to functions
      { permission_id: getPermissionId('campaign_images.read'), permission_function_id: getFunctionId('getCampaignImages') },
      { permission_id: getPermissionId('campaign_images.upload'), permission_function_id: getFunctionId('uploadCampaignImage') },
      { permission_id: getPermissionId('campaign_images.review'), permission_function_id: getFunctionId('reviewCampaignImage') },
      { permission_id: getPermissionId('campaign_images.delete'), permission_function_id: getFunctionId('deleteCampaignImage') },
      
      // Role management permissions to functions
      { permission_id: getPermissionId('roles.read'), permission_function_id: getFunctionId('getAllRoles') },
      { permission_id: getPermissionId('roles.read'), permission_function_id: getFunctionId('getAllPermissions') },
      { permission_id: getPermissionId('roles.create'), permission_function_id: getFunctionId('createRole') },
      { permission_id: getPermissionId('roles.update'), permission_function_id: getFunctionId('updateRole') },
      { permission_id: getPermissionId('roles.delete'), permission_function_id: getFunctionId('deleteRole') },
      
      // Utility permissions to functions
      { permission_id: getPermissionId('utilities.migrate_passwords'), permission_function_id: getFunctionId('migratePasswords') }
    ]);
    console.log('✓ Assigned functions to permissions');

    // Migrate existing users to the new role system
    const existingUsers = await knex('users').select('id');
    
    // Since we removed the role column, we need to assign a default role to existing users
    // Let's assume the first user is an employee and others are clients
    for (let i = 0; i < existingUsers.length; i++) {
      const user = existingUsers[i];
      const defaultRole = i === 0 ? 'employee' : 'client'; // First user becomes employee
      const roleId = getRoleId(defaultRole);
      
      await knex('user_roles').insert({
        user_id: user.id,
        role_id: roleId
      });
    }
    console.log(`✓ Migrated ${existingUsers.length} existing users to new role system`);

    console.log('All RBAC seed data inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

runSeeds();
