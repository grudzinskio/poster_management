/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('permissions', function(table) {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();
    table.string('description', 500).nullable();
    table.string('resource', 100).notNullable(); // e.g., 'users', 'campaigns', 'companies'
    table.string('action', 50).notNullable(); // e.g., 'create', 'read', 'update', 'delete'
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Ensure unique combination of resource and action
    table.unique(['resource', 'action']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('permissions');
};
