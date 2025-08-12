/**
 * Migration: Add user_type field to users table
 * 
 * This migration adds a user_type ENUM field to the users table to distinguish
 * between employee, client, and contractor user types. This field works alongside
 * the RBAC system to provide both type-based and role-based access control.
 */

exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.enum('user_type', ['employee', 'client', 'contractor']).after('password');
    table.index('user_type'); // Add index for better query performance
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropIndex('user_type');
    table.dropColumn('user_type');
  });
};
