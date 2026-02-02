const {PUBLIC_SCHEMA} = require("../libs/dbConstants");
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA).alterTable('items', (table) => {
        table.integer('order_id').unsigned().references('order_id').inTable('orders').onDelete('SET NULL');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA).alterTable('items', (table) => {
        table.dropColumn('order_id');
    });
};
