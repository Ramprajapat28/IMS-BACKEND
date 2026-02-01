const {PUBLIC_SCHEMA} = require("../utilities/MigrationUtilities");
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA).alterTable('products', (table) => {
        table.integer('reorder_level').defaultTo(10);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA).alterTable('products', (table) => {
        table.dropColumn('reorder_level');
    });
};
