/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Drop all existing tables in reverse dependency order
  await knex.schema.dropTableIfExists('campaign_assignments');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('campaigns');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('companies');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');

  // Create roles table
  await knex.schema.createTable('roles', (table) => {
    table.increments('id').unsigned().primary();
    table.string('name', 100).notNullable().unique();
    table.string('description', 500).nullable();
  });

  // Create permissions table
  await knex.schema.createTable('permissions', (table) => {
    table.increments('id').unsigned().primary();
    table.string('permission', 100).notNullable().unique();
    table.string('description', 500).nullable();
  });

  // Create companies table
  await knex.schema.createTable('companies', (table) => {
    table.increments('id').unsigned().primary();
    table.string('name', 255).notNullable().unique();
  });

  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').unsigned().primary();
    table.string('username', 255).notNullable().unique();
    table.string('password', 255).notNullable();
    table.integer('company_id').unsigned().nullable();
    table.enu('user_type', ['employee', 'client', 'contractor']).notNullable().defaultTo('employee');
    
    // Foreign key constraints
    table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');
    table.index('company_id');
  });

  // Create campaigns table
  await knex.schema.createTable('campaigns', (table) => {
    table.increments('id').unsigned().primary();
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.integer('company_id').unsigned().nullable();
    table.enu('status', ['pending', 'approved', 'in_progress', 'completed', 'cancelled']).nullable().defaultTo('pending');
    table.date('start_date').nullable();
    table.date('end_date').nullable();
    table.integer('created_by').unsigned().nullable();
    
    // Foreign key constraints
    table.foreign('company_id').references('id').inTable('companies').onDelete('SET NULL');
    table.foreign('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.index('company_id');
    table.index('created_by');
  });

  // Create user_roles table
  await knex.schema.createTable('user_roles', (table) => {
    table.increments('id').unsigned().primary();
    table.integer('user').unsigned().notNullable();
    table.integer('role').unsigned().notNullable();
    
    // Foreign key constraints
    table.foreign('user').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('role').references('id').inTable('roles').onDelete('CASCADE');
    table.index('user');
    table.index('role');
  });

  // Create role_permissions table
  await knex.schema.createTable('role_permissions', (table) => {
    table.increments('id').unsigned().primary();
    table.integer('role').unsigned().notNullable();
    table.integer('permission').unsigned().notNullable();
    
    // Foreign key constraints
    table.foreign('role').references('id').inTable('roles').onDelete('CASCADE');
    table.foreign('permission').references('id').inTable('permissions').onDelete('CASCADE');
    table.index('role');
    table.index('permission');
  });

  // Create campaign_assignments table
  await knex.schema.createTable('campaign_assignments', (table) => {
    table.increments('id').unsigned().primary();
    table.integer('campaign_id').unsigned().notNullable();
    table.integer('contractor_id').unsigned().notNullable();
    
    // Foreign key constraints
    table.foreign('campaign_id').references('id').inTable('campaigns').onDelete('CASCADE');
    table.foreign('contractor_id').references('id').inTable('users').onDelete('CASCADE');
    table.index('campaign_id');
    table.index('contractor_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Drop all tables in reverse dependency order
  await knex.schema.dropTableIfExists('campaign_assignments');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('campaigns');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('companies');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
};
