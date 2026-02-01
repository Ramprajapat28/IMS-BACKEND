const BaseModel = require("./libs/BaseModel");
const DatabaseError = require("../errorhandlers/DatabaseError");
const { ITEM_STATUS } = require("./libs/dbConstants");

class ItemModel extends BaseModel {
  constructor(userId) {
    super(userId);
    this.tableName = "items";
  }


  getPublicColumns() {
    return ["id", "name", "shelf_id", "rack_id", "product_id", "status", "is_deleted"];
  }

  async findAllPaginated(filters = {}, page = 1, limit = 10) {
    try {
      const qb = await this.getQueryBuilder();
      const offset = (page - 1) * limit;

      const selectColumns = [
        "items.id as item_id",
        "items.product_id",
        "items.shelf_id",
        "items.status",
        "items.is_deleted",
        "items.created_at",
        "items.updated_at",

        "products.name as product_name",
        "products.description as product_description",
        "products.sku as product_sku",
        "products.barcode as product_barcode",
        "products.vendor_id as product_vendor_id",

        "shelf.shelf_name",
        "shelf.capacity as shelf_capacity",

        "rooms.room_name",
        "warehouses.name as warehouse_name",
      ];

      let query = qb("items")
        .select(selectColumns)
        .leftJoin("products", "items.product_id", "products.product_id")
        .leftJoin("shelf", "items.shelf_id", "shelf.shelf_id")
        .leftJoin("rooms", "shelf.room_id", "rooms.room_id")
        .leftJoin("warehouses", "shelf.warehouse_id", "warehouses.warehouse_id")
        .where("items.is_deleted", false);

      if (filters.product_id) {
        query.where("items.product_id", filters.product_id);
      }
      if (filters.shelf_id) {
        query.where("items.shelf_id", filters.shelf_id);
      }
      if (filters.rack_id) {
        query.where("items.rack_id", filters.rack_id);
      }
      if (filters.status) {
        query.where("items.status", filters.status);
      }

      const data = await query
        .orderBy("items.created_at", "desc")
        .limit(limit)
        .offset(offset);

      const [{ count }] = await qb("items")
        .where("items.is_deleted", false)
        .modify(qb => {
          if (filters.product_id) qb.where("product_id", filters.product_id);
          if (filters.shelf_id) qb.where("shelf_id", filters.shelf_id);
          if (filters.rack_id) qb.where("rack_id", filters.rack_id);
          if (filters.status) qb.where("status", filters.status);
        })
        .count("* as count");

      return { data, total: Number(count) };
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async create(data, product_id) {
    try {
      const qb = await this.getQueryBuilder();
      const insertData = this.insertStatement({
        ...data,
        product_id,
        status: ITEM_STATUS.AVAILABLE,
      });

      const [item] = await qb("items")
        .insert(insertData)
        .returning(this.getPublicColumns());

      return item;
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async findByProductId(product_id) {
    try {
      const qb = await this.getQueryBuilder();

      return await qb("items")
        .leftJoin("products", "items.product_id", "products.product_id")
        .leftJoin("shelf", "items.shelf_id", "shelf.shelf_id")
        .leftJoin("rooms", "shelf.room_id", "rooms.room_id")
        .leftJoin("warehouses", "shelf.warehouse_id", "warehouses.warehouse_id")
        .where("items.product_id", product_id)
        .where("items.is_deleted", false);
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  // ✅ FIXED: count only AVAILABLE items
  async countByProductId(product_id) {
    try {
      const qb = await this.getQueryBuilder();

      const [{ count }] = await qb("items")
        .where({
          product_id,
          is_deleted: false,
          status: ITEM_STATUS.AVAILABLE,
        })
        .count("* as count");

      return Number(count);
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async updateItemStatus({ item_id, product_id, quantity = 1, status }) {
    try {
      const normalizedStatus = String(status).toLowerCase();

      if (!Object.values(ITEM_STATUS).includes(normalizedStatus)) {
        throw new Error("Invalid item status");
      }

      const qb = await this.getQueryBuilder();
      const isDeleted =
        normalizedStatus !== ITEM_STATUS.RETURNED &&
        normalizedStatus !== ITEM_STATUS.AVAILABLE;

      if (item_id) {
        const [updated] = await qb("items")
          .where({ id: item_id })
          .update({
            status: normalizedStatus,
            is_deleted: isDeleted,
            updated_at: qb.raw("CURRENT_TIMESTAMP"),
          })
          .returning("*");

        return updated;
      }

      if (product_id) {
        return qb("items")
          .whereIn("id", function () {
            this.select("id")
              .from("items")
              .where({ product_id, is_deleted: false })
              .limit(quantity);
          })
          .update({
            status: normalizedStatus,
            is_deleted: isDeleted,
            updated_at: qb.raw("CURRENT_TIMESTAMP"),
          });
      }

      throw new Error("Either item_id or product_id is required");
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async countAvailableItemsByProduct() {
    try {
      const qb = await this.getQueryBuilder();

      return await qb("products as p")
        .select([
          "p.product_id",
          "p.name",
          "p.reorder_level",
          qb.raw("COUNT(i.id)::integer as available_count")
        ])
        .leftJoin("items as i", function () {
          this.on("p.product_id", "i.product_id")
            .andOn("i.status", qb.raw("?", [ITEM_STATUS.AVAILABLE]))
            .andOn("i.is_deleted", qb.raw("false"));
        })
        .where("p.is_deleted", false)
        .groupBy("p.product_id", "p.name", "p.reorder_level");
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async softDelete(product_id, quantity, status, shelf_id = null, rack_id = null) {
    try {
      const qb = await this.getQueryBuilder();
      const isReturn = status === ITEM_STATUS.AVAILABLE || status === ITEM_STATUS.RETURNED;
      const isDeleted = !isReturn;

      return qb("items")
        .whereIn("id", function () {
          const subQuery = this.select("id")
            .from("items")
            .where({
              product_id,
              is_deleted: !isDeleted, // if we want to set is_deleted=false (return), we look for is_deleted=true (sold)
            });

          // Only filter by original location if we are SELLING (decreasing stock)
          // If we are RETURNING, we can return from any previous sale of this product
          if (!isReturn) {
            if (shelf_id) {
              subQuery.where("shelf_id", shelf_id);
            }
            if (rack_id) {
              subQuery.where("rack_id", rack_id);
            }
          }

          subQuery.limit(quantity);
        })
        .update({
          is_deleted: isDeleted,
          status,
          shelf_id: isReturn ? (shelf_id || null) : qb.raw("shelf_id"), // Update location on return
          rack_id: isReturn ? (rack_id || null) : qb.raw("rack_id"),   // Update location on return
          updated_at: qb.raw("CURRENT_TIMESTAMP"),
        });
    } catch (e) {
      throw new DatabaseError(e);
    }
  }
  // New method for full product details
  async getAllItemsByProductId(product_id) {
    try {
      const qb = await this.getQueryBuilder();

      const selectColumns = [
        "items.id as item_id",
        "items.product_id",
        "items.status",
        "items.shelf_id",
        "items.rack_id",
        "items.created_at",

        // Location info (shelf-based)
        "shelf.shelf_name",
        "shelf.room_id",
        "shelf.warehouse_id",
        "rooms.room_name",
        "warehouses.name as warehouse_name",

        // Location info (rack-based)
        "racks.rack_name",
        "racks.room_id as rack_room_id",
        "racks.warehouse_id as rack_warehouse_id",
        "rack_rooms.room_name as rack_room_name",
        "rack_warehouses.name as rack_warehouse_name",

        // Product info (redundant but useful for join validation)
        "products.name as product_name",
        "products.sku as product_sku"
      ];

      return await qb("items")
        .select(selectColumns)
        .leftJoin("products", "items.product_id", "products.product_id")
        .leftJoin("shelf", "items.shelf_id", "shelf.shelf_id")
        .leftJoin("racks", "items.rack_id", "racks.rack_id")
        .leftJoin("rooms", "shelf.room_id", "rooms.room_id")
        .leftJoin("warehouses", "shelf.warehouse_id", "warehouses.warehouse_id")
        // Join rooms and warehouses for rack-based items
        .leftJoin("rooms as rack_rooms", "racks.room_id", "rack_rooms.room_id")
        .leftJoin("warehouses as rack_warehouses", "racks.warehouse_id", "rack_warehouses.warehouse_id")
        .where("items.product_id", product_id)
        .where("items.is_deleted", false);

    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async findByProductIds(productIds) {
    try {
      const qb = await this.getQueryBuilder();

      const selectColumns = [
        "items.id as item_id",
        "items.product_id",
        "items.status",
        "items.shelf_id",
        "items.rack_id",
        // Location info (shelf)
        "shelf.shelf_name",
        "rooms.room_name",
        "warehouses.name as warehouse_name",
        // Location info (rack)
        "racks.rack_name",
      ];

      return await qb("items")
        .select(selectColumns)
        .leftJoin("shelf", "items.shelf_id", "shelf.shelf_id")
        .leftJoin("racks", "items.rack_id", "racks.rack_id")
        .leftJoin("rooms", "shelf.room_id", "rooms.room_id")
        .leftJoin("warehouses", "shelf.warehouse_id", "warehouses.warehouse_id")
        .whereIn("items.product_id", productIds)
        .where("items.is_deleted", false);

    } catch (e) {
      throw new DatabaseError(e);
    }
  }
  async returnItems(product_id, quantity, shelf_id) {
    try {
      const qb = await this.getQueryBuilder();

      return qb("items")
        .whereIn("id", function () {
          this.select("id")
            .from("items")
            .where({
              product_id,
              status: ITEM_STATUS.SOLD,
              is_deleted: true
            })
            .limit(quantity);
        })
        .update({
          is_deleted: false,
          status: ITEM_STATUS.AVAILABLE,
          shelf_id: shelf_id,
          updated_at: qb.raw("CURRENT_TIMESTAMP"),
        });

    } catch (e) {
      throw new DatabaseError(e);
    }
  }
}

module.exports = ItemModel;
