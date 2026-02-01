const { addDefaultColumns } = require("../utilities/MigrationUtilities");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
    return await knex.schema.withSchema('public')
        .createTable('shelf', function (table) {
    table.increments("shelf_id").primary();
    table.string("shelf_name", 100).notNullable();
    table.integer("warehouse_id").notNullable();
    table.integer("room_id").notNullable();
    table.integer("capacity");
    table.foreign("warehouse_id").references("warehouse_id").inTable("warehouses").onDelete("CASCADE");
    table.foreign("room_id").references("room_id").inTable("rooms").onDelete("CASCADE");
    addDefaultColumns(table, knex);
  
    // Indexes
    table.index("warehouse_id");
    table.index("room_id");
    table.index("shelf_name");
});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return 
  
};



