/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('permission_functions', function(table) {
    table.increments('id').primary();
    table.string('function_name', 100).notNullable().unique();
    table.string('description', 500).nullable();
    table.string('module', 100).nullable(); // e.g., 'userController', 'campaignController'
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('permission_functions');
};
