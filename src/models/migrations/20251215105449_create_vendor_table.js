/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const {addDefaultColumns} = require("../utilities/MigrationUtilities")
const {PUBLIC_SCHEMA}= require("../libs/dbConstants")


exports.up = function(knex) {
  return knex.schema.withSchema(PUBLIC_SCHEMA)
    .createTable('vendors',function(table){
        table.increments('vendor_id').notNullable().primary()    // pk 
        table.string('vendor_name',255).notNullable();
        table.string('email',255).unique().notNullable();
        table.string('phone',50).notNullable();
       
        table.text('address').nullable();
       

        addDefaultColumns(table,knex);

       
      
    
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.withSchema(PUBLIC_SCHEMA).dropTableIfExists('vendors');
};
