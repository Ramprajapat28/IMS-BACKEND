const {PUBLIC_SCHEMA} = require("../libs/dbConstants");
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA).alterTable('products', (table) => {
        table.renameColumn('cost_to_consumer', 'cost_to_company');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA).alterTable('products', (table) => {
        table.renameColumn('cost_to_company', 'cost_to_consumer');
    });
};
