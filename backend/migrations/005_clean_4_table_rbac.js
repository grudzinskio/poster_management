// Migration: Create clean 4-table RBAC schema
// This creates the exact 4-table structure you requested:
// 1. Users table (already exists) 
// 2. Users-to-Roles table (just user_id, role_name - no separate roles table)
// 3. Roles-to-Permissions table (role_name, permission_name - no separate tables)
// 4. Permissions-to-Functions table (permission_name, function_name - no separate tables)

exports.up = async function(knex) {
  console.log('Creating clean 4-table RBAC schema...');

  // Backup existing data first
  const existingUserRoles = await knex('user_roles')
    .join('roles', 'user_roles.role_id', 'roles.id')
    .select('user_roles.user_id', 'roles.name as role_name', 'user_roles.is_active');

  const existingRolePermissions = await knex('role_permissions')
    .join('roles', 'role_permissions.role_id', 'roles.id')
    .join('permissions', 'role_permissions.permission_id', 'permissions.id')
    .select('roles.name as role_name', 'permissions.name as permission_name', 'role_permissions.is_active');

  // 1. Drop all existing RBAC tables except users
  await knex.schema.dropTableIfExists('permission_permission_functions');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('permission_functions');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');

  // 2. Create new Users-to-Roles table (Table 2)
  await knex.schema.createTable('user_roles', function(table) {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.string('role_name', 50).notNullable(); // Direct role name, no FK
    table.boolean('is_active').defaultTo(true);
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    
    // Foreign key to users only
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Prevent duplicate role assignments
    table.unique(['user_id', 'role_name']);
    
    table.index('user_id');
    table.index('role_name');
  });

  // 3. Create new Roles-to-Permissions table (Table 3)
  await knex.schema.createTable('role_permissions', function(table) {
    table.increments('id').primary();
    table.string('role_name', 50).notNullable(); // Direct role name
    table.string('permission_name', 100).notNullable(); // Direct permission name
    table.boolean('is_active').defaultTo(true);
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    
    // Prevent duplicate permission assignments
    table.unique(['role_name', 'permission_name']);
    
    table.index('role_name');
    table.index('permission_name');
  });

  // 4. Create new Permissions-to-Functions table (Table 4)
  await knex.schema.createTable('permission_functions', function(table) {
    table.increments('id').primary();
    table.string('permission_name', 100).notNullable(); // Direct permission name
    table.string('function_name', 100).notNullable(); // Direct function name
    table.string('description', 500);
    table.string('module', 100); // e.g., 'user_management', 'campaign_management'
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Prevent duplicate function assignments
    table.unique(['permission_name', 'function_name']);
    
    table.index('permission_name');
    table.index('function_name');
    table.index('module');
  });

  // 5. Restore user-role assignments with the new structure
  for (const userRole of existingUserRoles) {
    await knex('user_roles').insert({
      user_id: userRole.user_id,
      role_name: userRole.role_name,
      is_active: userRole.is_active
    });
  }

  // 6. Restore role-permission assignments with the new structure
  for (const rolePerm of existingRolePermissions) {
    await knex('role_permissions').insert({
      role_name: rolePerm.role_name,
      permission_name: rolePerm.permission_name,
      is_active: rolePerm.is_active
    });
  }

  // 7. Populate permission-function mappings
  const permissionFunctionMappings = [
    // User Management
    { permission_name: 'users.read', function_name: 'view_user_list', description: 'Display list of users', module: 'user_management' },
    { permission_name: 'users.read', function_name: 'view_user_details', description: 'View detailed user information', module: 'user_management' },
    { permission_name: 'users.create', function_name: 'create_user_form', description: 'Show create user form', module: 'user_management' },
    { permission_name: 'users.create', function_name: 'save_new_user', description: 'Save new user to database', module: 'user_management' },
    { permission_name: 'users.update', function_name: 'edit_user_form', description: 'Show edit user form', module: 'user_management' },
    { permission_name: 'users.update', function_name: 'update_user_data', description: 'Update user information in database', module: 'user_management' },
    { permission_name: 'users.delete', function_name: 'delete_user_confirm', description: 'Show delete user confirmation', module: 'user_management' },
    { permission_name: 'users.delete', function_name: 'remove_user_record', description: 'Remove user from database', module: 'user_management' },
    
    // Company Management
    { permission_name: 'companies.read', function_name: 'view_company_list', description: 'Display list of companies', module: 'company_management' },
    { permission_name: 'companies.read', function_name: 'view_company_details', description: 'View detailed company information', module: 'company_management' },
    { permission_name: 'companies.create', function_name: 'create_company_form', description: 'Show create company form', module: 'company_management' },
    { permission_name: 'companies.create', function_name: 'save_new_company', description: 'Save new company to database', module: 'company_management' },
    { permission_name: 'companies.update', function_name: 'edit_company_form', description: 'Show edit company form', module: 'company_management' },
    { permission_name: 'companies.update', function_name: 'update_company_data', description: 'Update company information in database', module: 'company_management' },
    { permission_name: 'companies.delete', function_name: 'delete_company_confirm', description: 'Show delete company confirmation', module: 'company_management' },
    { permission_name: 'companies.delete', function_name: 'remove_company_record', description: 'Remove company from database', module: 'company_management' },
    
    // Campaign Management
    { permission_name: 'campaigns.read', function_name: 'view_campaign_list', description: 'Display list of campaigns', module: 'campaign_management' },
    { permission_name: 'campaigns.read', function_name: 'view_campaign_details', description: 'View detailed campaign information', module: 'campaign_management' },
    { permission_name: 'campaigns.create', function_name: 'create_campaign_form', description: 'Show create campaign form', module: 'campaign_management' },
    { permission_name: 'campaigns.create', function_name: 'save_new_campaign', description: 'Save new campaign to database', module: 'campaign_management' },
    { permission_name: 'campaigns.update', function_name: 'edit_campaign_form', description: 'Show edit campaign form', module: 'campaign_management' },
    { permission_name: 'campaigns.update', function_name: 'update_campaign_data', description: 'Update campaign information in database', module: 'campaign_management' },
    { permission_name: 'campaigns.delete', function_name: 'delete_campaign_confirm', description: 'Show delete campaign confirmation', module: 'campaign_management' },
    { permission_name: 'campaigns.delete', function_name: 'remove_campaign_record', description: 'Remove campaign from database', module: 'campaign_management' },
    { permission_name: 'campaigns.assign', function_name: 'assign_contractor_to_campaign', description: 'Assign contractors to campaigns', module: 'campaign_management' },
    
    // Campaign Images
    { permission_name: 'campaign_images.read', function_name: 'view_campaign_images', description: 'View campaign images', module: 'campaign_images' },
    { permission_name: 'campaign_images.upload', function_name: 'upload_campaign_image', description: 'Upload new campaign images', module: 'campaign_images' },
    { permission_name: 'campaign_images.review', function_name: 'review_campaign_image', description: 'Review and approve/reject images', module: 'campaign_images' },
    { permission_name: 'campaign_images.delete', function_name: 'delete_campaign_image', description: 'Delete campaign images', module: 'campaign_images' },
    
    // Role Management
    { permission_name: 'roles.read', function_name: 'view_role_list', description: 'Display list of roles', module: 'role_management' },
    { permission_name: 'roles.read', function_name: 'view_role_details', description: 'View detailed role information', module: 'role_management' },
    { permission_name: 'roles.create', function_name: 'create_role_form', description: 'Show create role form', module: 'role_management' },
    { permission_name: 'roles.create', function_name: 'save_new_role', description: 'Save new role to database', module: 'role_management' },
    { permission_name: 'roles.update', function_name: 'edit_role_form', description: 'Show edit role form', module: 'role_management' },
    { permission_name: 'roles.update', function_name: 'update_role_data', description: 'Update role information in database', module: 'role_management' },
    { permission_name: 'roles.delete', function_name: 'delete_role_confirm', description: 'Show delete role confirmation', module: 'role_management' },
    { permission_name: 'roles.delete', function_name: 'remove_role_record', description: 'Remove role from database', module: 'role_management' },
    
    // System Utilities
    { permission_name: 'utilities.migrate_passwords', function_name: 'migrate_user_passwords', description: 'Migrate plaintext passwords to hashed', module: 'system_utilities' }
  ];

  for (const mapping of permissionFunctionMappings) {
    await knex('permission_functions').insert({
      permission_name: mapping.permission_name,
      function_name: mapping.function_name,
      description: mapping.description,
      module: mapping.module,
      is_active: true
    });
  }

  console.log('Clean 4-table RBAC schema created successfully!');
  console.log('Final schema:');
  console.log('1. users (user_id primary key)');
  console.log('2. user_roles (user_id, role_name)');
  console.log('3. role_permissions (role_name, permission_name)');
  console.log('4. permission_functions (permission_name, function_name)');
};

exports.down = async function(knex) {
  console.log('Rolling back clean 4-table RBAC schema...');
  
  // This would restore the complex structure, but given the simplification
  // goal, we'll just drop the new tables
  await knex.schema.dropTableIfExists('permission_functions');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('user_roles');
  
  console.log('Rollback completed - you may need to restore from backup');
};
