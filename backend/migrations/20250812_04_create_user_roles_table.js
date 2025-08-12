/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_roles', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('role_id').unsigned().notNullable();
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').nullable();
    table.boolean('is_active').defaultTo(true);
    
    // Foreign key constraints
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('role_id').references('id').inTable('roles').onDelete('CASCADE');
    
    // Ensure a user can't have the same role twice
    table.unique(['user_id', 'role_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('user_roles');
};
