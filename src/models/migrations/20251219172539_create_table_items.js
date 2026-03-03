

const { PUBLIC_SCHEMA } = require("../libs/dbConstants")
const { addDefaultColumns } = require("../utilities/MigrationUtilities");


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    return await knex.schema.withSchema(PUBLIC_SCHEMA)
        .createTable('items', (table) => {

            table
                .increments('id').primary().notNullable();

            table    
                .string('name', 50).notNullable();

            table    
                .string("status")
      .notNullable()
      .defaultTo("available");

            table
                .integer('shelf_id').notNullable()
                .references('shelf_id').inTable(`${PUBLIC_SCHEMA}.shelf`)
            
            table
                .integer('product_id').notNullable()
                .references('product_id').inTable(`${PUBLIC_SCHEMA}.products`)



            addDefaultColumns(table, knex);

        })

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    return await knex.schema.withSchema(PUBLIC_SCHEMA)
    .dropTableIfExists('items');
    

};
