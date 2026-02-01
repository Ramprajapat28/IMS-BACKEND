const {PUBLIC_SCHEMA} = require('../libs/dbConstants');

exports.up = function (knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA).alterTable('orders', function (table) {
        // Make shelf_id nullable
        table.integer('shelf_id').nullable().alter();

        // Add rack_id column
        table.integer('rack_id').nullable();

        // Add foreign key constraint to racks table
        table.foreign('rack_id')
            .references('rack_id')
            .inTable('racks')
            .onDelete('CASCADE');
    });
};

exports.down = function (knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA).alterTable('orders', function (table) {
        // Remove foreign key constraint
        table.dropForeign('rack_id');

        // Drop rack_id column
        table.dropColumn('rack_id');

        // Make shelf_id NOT NULL again
        table.integer('shelf_id').notNullable().alter();
    });
};