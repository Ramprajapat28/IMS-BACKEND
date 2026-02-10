const BaseModel = require("./libs/BaseModel");
const DatabaseError = require("../errorhandlers/DatabaseError");

class ShelfModel extends BaseModel {
  constructor(userId) {
    super(userId);
  }

  // ✅ PUBLIC COLUMNS
  getPublicColumns() {
    return ["shelf_id", "shelf_name", "warehouse_id", "room_id", "capacity"];
  }

  async getAllShelfPaginated(filters = {}, page = 1, limit = 10) {
    try {
      const qb = await this.getQueryBuilder();
      const offset = (page - 1) * limit;

      const selectColumns = [
        // Shelf columns
        "shelf.shelf_id",
        "shelf.shelf_name",
        "shelf.capacity",
        "shelf.room_id",
        "shelf.warehouse_id",
        "shelf.created_at",
        "shelf.updated_at",

        // Room columns
        "rooms.room_name",

        // Warehouse columns
        "warehouses.name as warehouse_name",
      ];

      let query = qb("shelf")
        .select(selectColumns)
        .leftJoin("rooms", "shelf.room_id", "rooms.room_id")
        .leftJoin("warehouses", "shelf.warehouse_id", "warehouses.warehouse_id")
        .where("shelf.is_deleted", false); // if soft delete exists

      // 🔍 Optional filters (same style as orders)
      if (filters.room_id) {
        query = query.where("shelf.room_id", filters.room_id);
      }
      if (filters.warehouse_id) {
        query = query.where("shelf.warehouse_id", filters.warehouse_id);
      }
      if (filters.shelf_name) {
        query = query.whereILike("shelf.shelf_name", `%${filters.shelf_name}%`);
      }

      const data = await query
        .orderBy("shelf.created_at", "desc")
        .limit(limit)
        .offset(offset);

      // 🔢 Count query (IMPORTANT: same filters)
      let countQuery = qb("shelf").where("shelf.is_deleted", false);

      if (filters.room_id) {
        countQuery = countQuery.where("shelf.room_id", filters.room_id);
      }
      if (filters.warehouse_id) {
        countQuery = countQuery.where(
          "shelf.warehouse_id",
          filters.warehouse_id
        );
      }
      if (filters.shelf_name) {
        countQuery = countQuery.whereILike(
          "shelf.shelf_name",
          `%${filters.shelf_name}%`
        );
      }

      const [{ count }] = await countQuery.count("* as count");

      return {
        data,
        total: Number(count),
      };
    } catch (error) {
      throw new DatabaseError(error);
    }
  }

  async createShelf(data) {
    try {
      const qb = await this.getQueryBuilder();
      const insertData = this.insertStatement(data);

      const [shelf] = await qb("shelf")
        .insert(insertData)
        .returning(this.getPublicColumns()); // ✅ HERE

      return shelf;
    } catch (error) {
      throw new DatabaseError(error);
    }
  }

  async getShelfById(id) {
    try {
      const qb = await this.getQueryBuilder();

      const shelf = await qb("shelf")
        .select([
          // Shelf columns
          "shelf.shelf_id",
          "shelf.shelf_name",
          "shelf.capacity",
          "shelf.room_id",
          "shelf.warehouse_id",
          "shelf.created_at",
          "shelf.updated_at",

          // Room columns
          "rooms.room_name",

          // Warehouse columns
          "warehouses.name as warehouse_name",
        ])
        .leftJoin("rooms", "shelf.room_id", "rooms.room_id")
        .leftJoin("warehouses", "shelf.warehouse_id", "warehouses.warehouse_id")
        .where("shelf.shelf_id", id)
        .first();

      return shelf || null;
    } catch (error) {
      throw new DatabaseError(error);
    }
  }

  async updateShelf(id, data) {
    try {
      const qb = await this.getQueryBuilder();
      const updateData = await this.updateStatement(data);

      const exists = await qb("shelf")
        .select("shelf_id")
        .where(this.whereStatement({ shelf_id: id }))
        .first();

      if (!exists) return null;

      const [shelf] = await qb("shelf")
        .update(updateData)
        .where(this.whereStatement({ shelf_id: id }))
        .returning(this.getPublicColumns()); // ✅ HERE

      return shelf;
    } catch (error) {
      throw new DatabaseError(error);
    }
  }

  async deleteShelf(id) {
    try {
      const qb = await this.getQueryBuilder();

      const exists = await qb("shelf")
        .select("shelf_id")
        .where(this.whereStatement({ shelf_id: id }))
        .first();

      if (!exists) return null;

      const [shelf] = await qb("shelf")
        .update({ is_deleted: true })
        .where(this.whereStatement({ shelf_id: id }))
        .returning(this.getPublicColumns()); // ✅ HERE

      return shelf;
    } catch (error) {
      throw new DatabaseError(error);
    }
  }
}

module.exports = ShelfModel;
