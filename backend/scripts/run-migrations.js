const knex = require('../config/knex');

async function runMigrations() {
  try {
    console.log('Running migrations...');
    
    // Create roles table
    if (!(await knex.schema.hasTable('roles'))) {
      await knex.schema.createTable('roles', function(table) {
        table.increments('id').primary();
        table.string('name', 100).notNullable().unique();
        table.string('description', 500).nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
      console.log('✓ Created roles table');
    }

    // Create permissions table
    if (!(await knex.schema.hasTable('permissions'))) {
      await knex.schema.createTable('permissions', function(table) {
        table.increments('id').primary();
        table.string('name', 100).notNullable().unique();
        table.string('description', 500).nullable();
        table.string('resource', 100).notNullable();
        table.string('action', 50).notNullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
        
        table.unique(['resource', 'action']);
      });
      console.log('✓ Created permissions table');
    }

    // Create permission_functions table
    if (!(await knex.schema.hasTable('permission_functions'))) {
      await knex.schema.createTable('permission_functions', function(table) {
        table.increments('id').primary();
        table.string('function_name', 100).notNullable().unique();
        table.string('description', 500).nullable();
        table.string('module', 100).nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
      });
      console.log('✓ Created permission_functions table');
    }

    // Create user_roles table
    if (!(await knex.schema.hasTable('user_roles'))) {
      await knex.schema.createTable('user_roles', function(table) {
        table.increments('id').primary();
        table.integer('user_id', 11).notNullable();
        table.integer('role_id', 11).notNullable();
        table.timestamp('assigned_at').defaultTo(knex.fn.now());
        table.timestamp('expires_at').nullable();
        table.boolean('is_active').defaultTo(true);
        
        table.unique(['user_id', 'role_id']);
      });
      console.log('✓ Created user_roles table');
    }

    // Create role_permissions table
    if (!(await knex.schema.hasTable('role_permissions'))) {
      await knex.schema.createTable('role_permissions', function(table) {
        table.increments('id').primary();
        table.integer('role_id', 11).notNullable();
        table.integer('permission_id', 11).notNullable();
        table.timestamp('assigned_at').defaultTo(knex.fn.now());
        table.boolean('is_active').defaultTo(true);
        
        table.unique(['role_id', 'permission_id']);
      });
      console.log('✓ Created role_permissions table');
    }

    // Create permission_permission_functions table
    if (!(await knex.schema.hasTable('permission_permission_functions'))) {
      await knex.schema.createTable('permission_permission_functions', function(table) {
        table.increments('id').primary();
        table.integer('permission_id', 11).notNullable();
        table.integer('permission_function_id', 11).notNullable();
        table.timestamp('assigned_at').defaultTo(knex.fn.now());
        table.boolean('is_active').defaultTo(true);
      });
      
      // Add unique constraint with shorter name
      await knex.schema.table('permission_permission_functions', function(table) {
        table.unique(['permission_id', 'permission_function_id'], 'perm_func_unique');
      });
      console.log('✓ Created permission_permission_functions table');
    }

    // Remove role column from users table (with check if it exists)
    const hasRoleColumn = await knex.schema.hasColumn('users', 'role');
    if (hasRoleColumn) {
      await knex.schema.table('users', function(table) {
        table.dropColumn('role');
      });
      console.log('✓ Removed role column from users table');
    }

    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
