/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('role_permissions', function(table) {
    table.increments('id').primary();
    table.integer('role_id').unsigned().notNullable();
    table.integer('permission_id').unsigned().notNullable();
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.boolean('is_active').defaultTo(true);
    
    // Foreign key constraints
    table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE');
    table.foreign('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
    
    // Ensure a role can't have the same permission twice
    table.unique(['role_id', 'permission_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('role_permissions');
};
