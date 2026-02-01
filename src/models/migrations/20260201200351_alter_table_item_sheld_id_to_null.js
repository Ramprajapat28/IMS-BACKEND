const {PUBLIC_SCHEMA} = require("../libs/dbConstants");

exports.up = function (knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA).alterTable('items', function (table) {
        
     
        // Make shelf_id nullable (items can have rack_id instead)
        table.integer('shelf_id').nullable().alter();
    });
};

exports.down = function (knex) {
    return knex.schema.withSchema(PUBLIC_SCHEMA).alterTable('items', function (table) {
      

        // Make shelf_id NOT NULL again
        table.integer('shelf_id').notNullable().alter();
    });
};