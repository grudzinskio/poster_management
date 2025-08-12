/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('permission_permission_functions', function(table) {
    table.increments('id').primary();
    table.integer('permission_id').unsigned().notNullable();
    table.integer('permission_function_id').unsigned().notNullable();
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.boolean('is_active').defaultTo(true);
    
    // Foreign key constraints
    table.foreign('permission_id').references('id').inTable('permissions').onDelete('CASCADE');
    table.foreign('permission_function_id').references('id').inTable('permission_functions').onDelete('CASCADE');
    
    // Ensure a permission can't have the same function twice
    table.unique(['permission_id', 'permission_function_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('permission_permission_functions');
};
