/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Create companies table first (referenced by users and campaigns)
    .createTable('companies', function(table) {
      table.increments('id').primary();
      table.string('name', 255).notNullable().unique();
    })
    
    // Create users table (referenced by many other tables)
    .createTable('users', function(table) {
      table.increments('id').primary();
      table.string('username', 255).notNullable().unique();
      table.string('password', 255).notNullable();
      table.enum('user_type', ['employee', 'client', 'contractor']).nullable();
      table.integer('company_id').unsigned().nullable();
      
      // Foreign key constraints
      table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');
      
      // Indexes
      table.index('user_type', 'idx_user_type');
      table.index('company_id', 'fk_users_company');
    })
    
    // Create campaigns table
    .createTable('campaigns', function(table) {
      table.increments('id').primary();
      table.string('name', 255).notNullable();
      table.text('description').nullable();
      table.integer('company_id').unsigned().nullable();
      table.enum('status', ['pending', 'approved', 'in_progress', 'completed', 'cancelled']).defaultTo('pending');
      table.date('start_date').nullable();
      table.date('end_date').nullable();
      table.integer('created_by').unsigned().nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Foreign key constraints
      table.foreign('company_id').references('id').inTable('companies');
      table.foreign('created_by').references('id').inTable('users');
      
      // Indexes
      table.index('company_id');
      table.index('created_by');
    })
    
    // Create campaign_assignments table
    .createTable('campaign_assignments', function(table) {
      table.increments('id').primary();
      table.integer('campaign_id').unsigned().notNullable();
      table.integer('contractor_id').unsigned().notNullable();
      table.timestamp('assigned_at').defaultTo(knex.fn.now());
      
      // Foreign key constraints
      table.foreign('campaign_id').references('id').inTable('campaigns').onDelete('CASCADE');
      table.foreign('contractor_id').references('id').inTable('users').onDelete('CASCADE');
      
      // Unique constraint
      table.unique(['campaign_id', 'contractor_id'], 'unique_assignment');
      
      // Indexes
      table.index('contractor_id');
    })
    
    // Create campaign_images table
    .createTable('campaign_images', function(table) {
      table.increments('id').primary();
      table.integer('campaign_id').unsigned().notNullable();
      table.integer('uploaded_by').unsigned().notNullable();
      table.string('filename', 255).notNullable();
      table.string('original_name', 255).notNullable();
      table.string('file_path', 500).notNullable();
      table.enum('status', ['pending', 'approved', 'rejected']).defaultTo('pending');
      table.text('rejection_reason').nullable();
      table.timestamp('uploaded_at').defaultTo(knex.fn.now());
      table.timestamp('reviewed_at').nullable();
      table.integer('reviewed_by').unsigned().nullable();
      
      // Foreign key constraints
      table.foreign('campaign_id').references('id').inTable('campaigns').onDelete('CASCADE');
      table.foreign('uploaded_by').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('reviewed_by').references('id').inTable('users').onDelete('SET NULL');
      
      // Indexes
      table.index('campaign_id');
      table.index('uploaded_by');
      table.index('reviewed_by');
    })
    
    // Create permission_functions table for RBAC
    .createTable('permission_functions', function(table) {
      table.increments('id').primary();
      table.string('permission_name', 100).notNullable();
      table.string('function_name', 100).notNullable();
      table.string('description', 500).nullable();
      table.string('module', 100).nullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Unique constraint
      table.unique(['permission_name', 'function_name'], 'permission_functions_permission_name_function_name_unique');
      
      // Indexes
      table.index('permission_name', 'permission_functions_permission_name_index');
      table.index('function_name', 'permission_functions_function_name_index');
      table.index('module', 'permission_functions_module_index');
    })
    
    // Create role_permissions table for RBAC
    .createTable('role_permissions', function(table) {
      table.increments('id').primary();
      table.string('role_name', 50).notNullable();
      table.string('permission_name', 100).notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamp('assigned_at').defaultTo(knex.fn.now());
      
      // Unique constraint
      table.unique(['role_name', 'permission_name'], 'role_permissions_role_name_permission_name_unique');
      
      // Indexes
      table.index('role_name', 'role_permissions_role_name_index');
      table.index('permission_name', 'role_permissions_permission_name_index');
    })
    
    // Create user_roles table for RBAC
    .createTable('user_roles', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.string('role_name', 50).notNullable();
      table.boolean('is_active').defaultTo(true);
      table.timestamp('assigned_at').defaultTo(knex.fn.now());
      
      // Foreign key constraints
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      
      // Unique constraint
      table.unique(['user_id', 'role_name'], 'user_roles_user_id_role_name_unique');
      
      // Indexes
      table.index('user_id', 'user_roles_user_id_index');
      table.index('role_name', 'user_roles_role_name_index');
    })
    
    // Add update trigger for campaigns table
    .then(function() {
      // Note: Knex doesn't have built-in support for MySQL triggers
      // The ON UPDATE current_timestamp() functionality will need to be handled in application code
      // or you can add a raw SQL trigger here if needed
      return Promise.resolve();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('user_roles')
    .dropTableIfExists('role_permissions')
    .dropTableIfExists('permission_functions')
    .dropTableIfExists('campaign_images')
    .dropTableIfExists('campaign_assignments')
    .dropTableIfExists('campaigns')
    .dropTableIfExists('users')
    .dropTableIfExists('companies');
};
