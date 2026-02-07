const WarehouseModel = require("../../models/WarehouseModel");
const ValidationError = require("../../errorhandlers/ValidationError");

class WarehouseManager {

  static async getAllWarehousesPaginated(page, limit, userId) {
    const model = new WarehouseModel(userId);
    const result = await model.getAllWarehousesPaginated(page, limit);

    return {
      warehouses: result.data,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit)
    };
  }

  static async getWarehouseById(id, userId) {
    const model = new WarehouseModel(userId);
    const warehouse = await model.findWarehouseById(id);

    if (!warehouse) {
      throw new ValidationError({
        details: [{
          path: ["warehouse_id"],
          message: "Warehouse not found"
        }]
      });
    }

    return warehouse;
  }

  static async createWarehouse(data, userId) {
    const {
      name,
      location,
      contact_person,
      contact_number
    } = data;

    if (!name || name.trim() === "") {
      throw new ValidationError({
        details: [{
          path: ["name"],
          message: "Warehouse name is required"
        }]
      });
    }

    const model = new WarehouseModel(userId);

    return model.create({
      name,
      location,
      contact_person,
      contact_number
    });
  }

  static async updateWarehouse(id, data, userId) {
    const model = new WarehouseModel(userId);

    const existing = await model.findWarehouseById(id);
    if (!existing) {
      throw new ValidationError({
        details: [{
          path: ["warehouse_id"],
          message: "Warehouse not found"
        }]
      });
    }

    return model.update(id, data);
  }

  static async deleteWarehouse(id, userId) {
    const model = new WarehouseModel(userId);

    const existing = await model.findWarehouseById(id);
    if (!existing) {
      throw new ValidationError({
        details: [{
          path: ["warehouse_id"],
          message: "Warehouse not found"
        }]
      });
    }

    return model.softDelete(id);
  }
}

module.exports = WarehouseManager;
