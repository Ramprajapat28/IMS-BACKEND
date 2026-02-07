const { PUBLIC_SCHEMA } = require("../libs/dbConstants");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.withSchema(PUBLIC_SCHEMA).table("warehouses", (table) => {
    table.string("contact_person");   
    table.string("contact_number");
  });

};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.withSchema(PUBLIC_SCHEMA).table("warehouses", (table) => {
    table.dropColumn("contact_person");
    table.dropColumn("contact_number");
  });
};
