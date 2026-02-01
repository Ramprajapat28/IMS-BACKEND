const {addDefaultColumns} = require("../utilities/MigrationUtilities");
const { PUBLIC_SCHEMA } = require("../libs/dbConstants");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA)
        .createTable('category', function(table) {
            table.increments('category_id').notNullable().primary(); 
            table.string('category_name', 100).notNullable().unique();
            addDefaultColumns(table, knex);

        });
  
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA)
        .dropTable('category');
  
};