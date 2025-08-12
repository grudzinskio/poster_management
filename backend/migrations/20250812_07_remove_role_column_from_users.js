/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // First, remove the role column from users table
  await knex.schema.table('users', function(table) {
    table.dropColumn('role');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Restore the role column
  await knex.schema.table('users', function(table) {
    table.enum('role', ['employee', 'client', 'contractor']).notNullable().defaultTo('client');
  });
};
