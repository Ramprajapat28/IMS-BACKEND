
const {addDefaultColumns} = require("../utilities/MigrationUtilities")
const {PUBLIC_SCHEMA}= require("../libs/dbConstants")
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA).createTable('stock_movements', (table) => {
        table.increments('id').primary();
        table.integer('product_id').notNullable();
        table.integer('quantity').notNullable();
        table.string('source_type', 50); // 'shelf' or 'rack'
        table.integer('source_id');
        table.string('dest_type', 50);   
        table.integer('dest_id');
        table.string('remark', 500);
        addDefaultColumns(table,knex); 

        // Indexes
        table.index('product_id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA).dropTableIfExists('stock_movements');
};
