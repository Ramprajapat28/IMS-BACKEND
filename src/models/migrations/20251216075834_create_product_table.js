const { addDefaultColumns } = require("../utilities/MigrationUtilities")


/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
 return  knex.schema.withSchema('public').createTable('products' , (table) => {

    table.increments('product_id').notNullable().primary(); // pk
    table.string('name', 255).notNullable();
    table.string('description', 1000);
    // table.integer('stock_quantity').notNullable().defaultTo(0);
    // table.integer('category_id').references('category_id').inTable('categories').onDelete('SET NULL');
    table.string('sku', 100).unique();
    table.string('barcode', 100).unique();
    table.string('supplier', 255);
    
    table.integer('vendor_id').references('vendor_id').inTable('public.vendors').onDelete('SET NULL');

   
    

    addDefaultColumns(table, knex);

    // Indexes
    table.index('name');
    table.index('sku');
    table.index('barcode');
});
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
 return knex.schema.withSchema('public').dropTableIfExists('products');
};
