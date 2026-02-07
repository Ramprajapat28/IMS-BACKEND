const BaseModel = require("../models/libs/BaseModel");
const DatabaseError = require("../errorhandlers/DatabaseError");

class WarehouseModel extends BaseModel {
  constructor(userId) {
    super(userId);
  }

  async findWarehouseById(id) {
    const qb = await this.getQueryBuilder();
    return qb("warehouses")
      .select(
        "warehouse_id",
        "name",
        "location",
        "contact_person",
        "contact_number",
        "created_at",
        "updated_at"
      )
      .where({ warehouse_id: id, is_deleted: false })
      .first();
  }

  async getAllWarehousesPaginated(page = 1, limit = 10) {
    try {
      const qb = await this.getQueryBuilder();
      const offset = (page - 1) * limit;

      const warehouses = await qb("warehouses")
        .select(
          "warehouse_id",
          "name",
          "location",
          "contact_person",
          "contact_number",
          "created_at",
          "updated_at"
        )
        .where("is_deleted", false)
        .orderBy("warehouse_id", "desc")
        .limit(limit)
        .offset(offset);

      const [{ count }] = await qb("warehouses")
        .where("is_deleted", false)
        .count("* as count");

      return {
        data: warehouses,
        total: Number(count)
      };
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async create(data) {
    try {
      const qb = await this.getQueryBuilder();

      const [warehouse] = await qb("warehouses")
        .insert({
          name: data.name,
          location: data.location || null,
          contact_person: data.contact_person || null,
          contact_number: data.contact_number || null,
          created_by: this.userId,
          last_modified_by: this.userId,
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning("*");

      return warehouse;
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async update(id, data) {
    try {
      const qb = await this.getQueryBuilder();

      const updateData = {
        updated_at: new Date(),
        last_modified_by: this.userId
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.contact_person !== undefined) updateData.contact_person = data.contact_person;
      if (data.contact_number !== undefined) updateData.contact_number = data.contact_number;

      const [warehouse] = await qb("warehouses")
        .where({ warehouse_id: id, is_deleted: false })
        .update(updateData)
        .returning("*");

      if (!warehouse) {
        throw new Error("Warehouse not found");
      }

      return warehouse;
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async softDelete(id) {
    try {
      const qb = await this.getQueryBuilder();

      const [warehouse] = await qb("warehouses")
        .where({ warehouse_id: id })
        .update({
          is_deleted: true,
          updated_at: new Date()
        })
        .returning("*");

      if (!warehouse) {
        throw new Error("Warehouse not found");
      }

      return warehouse;
    } catch (e) {
      throw new DatabaseError(e);
    }
  }
}

module.exports = WarehouseModel;
