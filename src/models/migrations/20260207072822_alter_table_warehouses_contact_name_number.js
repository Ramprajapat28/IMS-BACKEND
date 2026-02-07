const { PUBLIC_SCHEMA } = require("../libs/dbConstants");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.withSchema(PUBLIC_SCHEMA).table("warehouses", (table) => {
    table.string("Contact_Name");   
    table.string("Contact_Number");
  });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.withSchema(PUBLIC_SCHEMA).table("warehouses", (table) => {
    table.dropColumn("Contact_Name");
    table.dropColumn("Contact_Number");
  });
};
