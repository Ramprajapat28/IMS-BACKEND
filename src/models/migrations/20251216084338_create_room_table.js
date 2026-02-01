/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const { addDefaultColumns } = require("../utilities/MigrationUtilities");
const { PUBLIC_SCHEMA } = require("../libs/dbConstants");

exports.up = function (knex) {
  return knex.schema
    .withSchema(PUBLIC_SCHEMA)
    .createTable("rooms", function (table) {
      table.increments("room_id").notNullable().primary(); // PK

      table.string("room_name", 255).notNullable();

      table
        .integer("warehouse_id")
        .notNullable()
        .references("warehouse_id")
        .inTable(`${PUBLIC_SCHEMA}.warehouses`)
        .onDelete("CASCADE");

      // common columns: created_at, updated_at, created_by, etc
      addDefaultColumns(table, knex);

      
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return 
};
