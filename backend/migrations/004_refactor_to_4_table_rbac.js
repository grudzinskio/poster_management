// Migration: Refactor to clean 4-table RBAC schema
// This migration restructures the RBAC system to use the exact 4-table design requested:
// 1. Users table (already exists)
// 2. Users-to-Roles table (user_roles - clean up)
// 3. Roles-to-Permissions table (role_permissions - clean up)  
// 4. Permissions-to-Permission Functions table (new: permission_functions + join table)

exports.up = async function(knex) {
  console.log('Starting 4-table RBAC refactoring...');

  // 1. Create the permission_functions table (low-level function definitions)
  await knex.schema.createTable('permission_functions', function(table) {
    table.increments('function_id').primary();
    table.string('function_name', 100).notNullable().unique();
    table.string('description', 500);
    table.string('module', 100); // e.g., 'user_management', 'campaign_management'
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index('function_name');
    table.index('module');
  });

  // 2. Create the permissions-to-permission-functions join table
  await knex.schema.createTable('permissions_to_functions', function(table) {
    table.increments('id').primary();
    table.integer('permission_id').unsigned().notNullable();
    table.integer('function_id').unsigned().notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
    table.foreign('function_id').references('function_id').inTable('permission_functions').onDelete('CASCADE');
    
    // Unique constraint to prevent duplicate assignments
    table.unique(['permission_id', 'function_id']);
    
    table.index('permission_id');
    table.index('function_id');
  });

  // 3. Clean up user_roles table - simplify to just the essentials
  // Remove unnecessary columns and keep it as a pure join table
  const userRolesColumns = await knex('information_schema.columns')
    .where({ table_name: 'user_roles', table_schema: knex.client.database() })
    .select('column_name');
  
  const hasExpiresAt = userRolesColumns.some(col => col.column_name === 'expires_at');
  const hasAssignedAt = userRolesColumns.some(col => col.column_name === 'assigned_at');
  
  if (hasExpiresAt) {
    await knex.schema.table('user_roles', function(table) {
      table.dropColumn('expires_at');
    });
  }
  
  if (hasAssignedAt) {
    await knex.schema.table('user_roles', function(table) {
      table.dropColumn('assigned_at');
    });
  }

  // 4. Clean up role_permissions table - simplify to just the essentials
  const rolePermColumns = await knex('information_schema.columns')
    .where({ table_name: 'role_permissions', table_schema: knex.client.database() })
    .select('column_name');
  
  const hasRolePermAssignedAt = rolePermColumns.some(col => col.column_name === 'assigned_at');
  
  if (hasRolePermAssignedAt) {
    await knex.schema.table('role_permissions', function(table) {
      table.dropColumn('assigned_at');
    });
  }

  // 5. Populate permission_functions with the low-level functions
  const permissionFunctions = [
    // User Management Functions
    { function_name: 'view_user_list', description: 'Display list of users', module: 'user_management' },
    { function_name: 'view_user_details', description: 'View detailed user information', module: 'user_management' },
    { function_name: 'create_user_form', description: 'Show create user form', module: 'user_management' },
    { function_name: 'save_new_user', description: 'Save new user to database', module: 'user_management' },
    { function_name: 'edit_user_form', description: 'Show edit user form', module: 'user_management' },
    { function_name: 'update_user_data', description: 'Update user information in database', module: 'user_management' },
    { function_name: 'delete_user_confirm', description: 'Show delete user confirmation', module: 'user_management' },
    { function_name: 'remove_user_record', description: 'Remove user from database', module: 'user_management' },
    
    // Company Management Functions
    { function_name: 'view_company_list', description: 'Display list of companies', module: 'company_management' },
    { function_name: 'view_company_details', description: 'View detailed company information', module: 'company_management' },
    { function_name: 'create_company_form', description: 'Show create company form', module: 'company_management' },
    { function_name: 'save_new_company', description: 'Save new company to database', module: 'company_management' },
    { function_name: 'edit_company_form', description: 'Show edit company form', module: 'company_management' },
    { function_name: 'update_company_data', description: 'Update company information in database', module: 'company_management' },
    { function_name: 'delete_company_confirm', description: 'Show delete company confirmation', module: 'company_management' },
    { function_name: 'remove_company_record', description: 'Remove company from database', module: 'company_management' },
    
    // Campaign Management Functions
    { function_name: 'view_campaign_list', description: 'Display list of campaigns', module: 'campaign_management' },
    { function_name: 'view_campaign_details', description: 'View detailed campaign information', module: 'campaign_management' },
    { function_name: 'create_campaign_form', description: 'Show create campaign form', module: 'campaign_management' },
    { function_name: 'save_new_campaign', description: 'Save new campaign to database', module: 'campaign_management' },
    { function_name: 'edit_campaign_form', description: 'Show edit campaign form', module: 'campaign_management' },
    { function_name: 'update_campaign_data', description: 'Update campaign information in database', module: 'campaign_management' },
    { function_name: 'delete_campaign_confirm', description: 'Show delete campaign confirmation', module: 'campaign_management' },
    { function_name: 'remove_campaign_record', description: 'Remove campaign from database', module: 'campaign_management' },
    { function_name: 'assign_contractor_to_campaign', description: 'Assign contractors to campaigns', module: 'campaign_management' },
    
    // Campaign Image Functions
    { function_name: 'view_campaign_images', description: 'View campaign images', module: 'campaign_images' },
    { function_name: 'upload_campaign_image', description: 'Upload new campaign images', module: 'campaign_images' },
    { function_name: 'review_campaign_image', description: 'Review and approve/reject images', module: 'campaign_images' },
    { function_name: 'delete_campaign_image', description: 'Delete campaign images', module: 'campaign_images' },
    
    // Role Management Functions
    { function_name: 'view_role_list', description: 'Display list of roles', module: 'role_management' },
    { function_name: 'view_role_details', description: 'View detailed role information', module: 'role_management' },
    { function_name: 'create_role_form', description: 'Show create role form', module: 'role_management' },
    { function_name: 'save_new_role', description: 'Save new role to database', module: 'role_management' },
    { function_name: 'edit_role_form', description: 'Show edit role form', module: 'role_management' },
    { function_name: 'update_role_data', description: 'Update role information in database', module: 'role_management' },
    { function_name: 'delete_role_confirm', description: 'Show delete role confirmation', module: 'role_management' },
    { function_name: 'remove_role_record', description: 'Remove role from database', module: 'role_management' },
    
    // System Utilities
    { function_name: 'migrate_user_passwords', description: 'Migrate plaintext passwords to hashed', module: 'system_utilities' }
  ];

  for (const func of permissionFunctions) {
    await knex('permission_functions').insert(func);
  }

  // 6. Create the mapping between permissions and functions
  const permissionToFunctionMappings = [
    // users.read -> view functions
    { permission_name: 'users.read', function_names: ['view_user_list', 'view_user_details'] },
    // users.create -> create functions
    { permission_name: 'users.create', function_names: ['create_user_form', 'save_new_user'] },
    // users.update -> edit functions
    { permission_name: 'users.update', function_names: ['edit_user_form', 'update_user_data'] },
    // users.delete -> delete functions
    { permission_name: 'users.delete', function_names: ['delete_user_confirm', 'remove_user_record'] },
    
    // companies.* -> company functions
    { permission_name: 'companies.read', function_names: ['view_company_list', 'view_company_details'] },
    { permission_name: 'companies.create', function_names: ['create_company_form', 'save_new_company'] },
    { permission_name: 'companies.update', function_names: ['edit_company_form', 'update_company_data'] },
    { permission_name: 'companies.delete', function_names: ['delete_company_confirm', 'remove_company_record'] },
    
    // campaigns.* -> campaign functions
    { permission_name: 'campaigns.read', function_names: ['view_campaign_list', 'view_campaign_details'] },
    { permission_name: 'campaigns.create', function_names: ['create_campaign_form', 'save_new_campaign'] },
    { permission_name: 'campaigns.update', function_names: ['edit_campaign_form', 'update_campaign_data'] },
    { permission_name: 'campaigns.delete', function_names: ['delete_campaign_confirm', 'remove_campaign_record'] },
    { permission_name: 'campaigns.assign', function_names: ['assign_contractor_to_campaign'] },
    
    // campaign_images.* -> image functions
    { permission_name: 'campaign_images.read', function_names: ['view_campaign_images'] },
    { permission_name: 'campaign_images.upload', function_names: ['upload_campaign_image'] },
    { permission_name: 'campaign_images.review', function_names: ['review_campaign_image'] },
    { permission_name: 'campaign_images.delete', function_names: ['delete_campaign_image'] },
    
    // roles.* -> role functions
    { permission_name: 'roles.read', function_names: ['view_role_list', 'view_role_details'] },
    { permission_name: 'roles.create', function_names: ['create_role_form', 'save_new_role'] },
    { permission_name: 'roles.update', function_names: ['edit_role_form', 'update_role_data'] },
    { permission_name: 'roles.delete', function_names: ['delete_role_confirm', 'remove_role_record'] },
    
    // utilities
    { permission_name: 'utilities.migrate_passwords', function_names: ['migrate_user_passwords'] }
  ];

  for (const mapping of permissionToFunctionMappings) {
    // Get permission ID
    const permission = await knex('permissions').where('name', mapping.permission_name).first();
    if (permission) {
      // Get function IDs and create mappings
      for (const functionName of mapping.function_names) {
        const func = await knex('permission_functions').where('function_name', functionName).first();
        if (func) {
          await knex('permissions_to_functions').insert({
            permission_id: permission.id,
            function_id: func.function_id,
            is_active: true
          });
        }
      }
    }
  }

  // 7. Drop the old permission_permission_functions table if it exists
  const tableExists = await knex.schema.hasTable('permission_permission_functions');
  if (tableExists) {
    await knex.schema.dropTable('permission_permission_functions');
  }

  console.log('4-table RBAC refactoring completed successfully!');
  console.log('Schema now has:');
  console.log('1. users (user_id primary key)');
  console.log('2. user_roles (user_id, role_id join table)');
  console.log('3. role_permissions (role_id, permission_id join table)');
  console.log('4. permissions_to_functions (permission_id, function_id join table)');
};

exports.down = async function(knex) {
  console.log('Rolling back 4-table RBAC refactoring...');
  
  // Drop new tables
  await knex.schema.dropTableIfExists('permissions_to_functions');
  await knex.schema.dropTableIfExists('permission_functions');
  
  // Restore old columns to user_roles
  await knex.schema.table('user_roles', function(table) {
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').nullable();
  });
  
  // Restore old columns to role_permissions
  await knex.schema.table('role_permissions', function(table) {
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
  });
  
  console.log('Rollback completed');
};
