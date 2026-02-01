const { addDefaultColumns } = require("../utilities/MigrationUtilities");



/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.withSchema('public').createTable('warehouses', (table) => {
        
        table.increments('warehouse_id').notNullable().primary(); // pk
        table.string('name',255).notNullable();
        table.string('location',500);
        table.integer('capacity').notNullable().defaultTo(0);
       
        
        addDefaultColumns(table, knex);
        

       
}); 
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {

    return 

};