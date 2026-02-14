const BaseModel = require("./libs/BaseModel");
const DatabaseError = require("../errorhandlers/DatabaseError");
const { ORDER_STATUS } = require("../models/libs/dbConstants")
const db = require("../models/libs/Db");

class OrderModel extends BaseModel {
    constructor(userId) {
        super(userId);
    }

    // ✅ PUBLIC COLUMNS
    getPublicColumns() {
        return ["order_id", "product_id", "shelf_id", "rack_id", "quantity", "status", "mode", "created_by", "created_at", "updated_at"];
    }

    async findAllPaginated(filters = {}, page = 1, limit = 10) {
        try {
            const qb = await this.getQueryBuilder();
            const offset = (page - 1) * limit;

            // Select columns with joins to get all related details
            const selectColumns = [
                // Order columns
                "orders.order_id",
                "orders.product_id",
                "orders.shelf_id",
                "orders.rack_id",
                "orders.quantity",
                "orders.status",
                "orders.created_by",
                "orders.created_at",
                "orders.updated_at",
                // Product columns
                "products.name as product_name",
                "products.description as product_description",
                "products.sku as product_sku",
                "products.barcode as product_barcode",
                "products.vendor_id as product_vendor_id",
                "products.product_image",
                // User columns
                "users.name as user_name",
                // Shelf columns
                "shelf.shelf_name",
                "shelf.warehouse_id",
                "shelf.room_id",
                "shelf.capacity as shelf_capacity",
                // Rack columns
                "racks.rack_name",
                "racks.warehouse_id as rack_warehouse_id",
                "racks.room_id as rack_room_id",
                // Warehouse columns
                "warehouses.name as warehouse_name",
                "rack_warehouses.name as rack_warehouse_name",
                // Room columns
                "rooms.room_name",
                "rack_rooms.room_name as rack_room_name",
                // Category columns
                "category.category_name",
                qb.raw("(SELECT json_agg(json_build_object('date', sub.date, 'count', sub.count)) FROM (SELECT items.created_at::date as date, count(*) as count FROM items WHERE items.order_id = orders.order_id GROUP BY items.created_at::date) sub) as inward_dates")
            ];

            let query = qb("orders")
                .select(selectColumns)
                .leftJoin("products", "orders.product_id", "products.product_id")
                .leftJoin("shelf", "orders.shelf_id", "shelf.shelf_id")
                .leftJoin("racks", "orders.rack_id", "racks.rack_id")
                .leftJoin("rooms", "shelf.room_id", "rooms.room_id")
                .leftJoin("warehouses", "shelf.warehouse_id", "warehouses.warehouse_id")
                .leftJoin("rooms as rack_rooms", "racks.room_id", "rack_rooms.room_id")
                .leftJoin("warehouses as rack_warehouses", "racks.warehouse_id", "rack_warehouses.warehouse_id")
                .leftJoin("category", "products.category_id", "category.category_id")
                .leftJoin("users", "orders.created_by", "users.user_id")
                .where("orders.is_deleted", false
                );

            // Apply filters
            if (filters.product_id) {
                query = query.where("orders.product_id", filters.product_id);
            }
            if (filters.shelf_id) {
                query = query.where("orders.shelf_id", filters.shelf_id);
            }
            if (filters.rack_id) {
                query = query.where("orders.rack_id", filters.rack_id);
            }
            if (filters.status) {
                query = query.where("orders.status", filters.status);
            }

            const data = await query
                .orderBy("orders.created_at", "desc")
                .limit(limit)
                .offset(offset);

            // Count query
            let countQuery = qb("orders")
                .where(this.whereStatement({}));

            if (filters.product_id) {
                countQuery = countQuery.where("orders.product_id", filters.product_id);
            }
            if (filters.shelf_id) {
                countQuery = countQuery.where("orders.shelf_id", filters.shelf_id);
            }
            if (filters.rack_id) {
                countQuery = countQuery.where("orders.rack_id", filters.rack_id);
            }
            if (filters.status) {
                countQuery = countQuery.where("orders.status", filters.status);
            }

            const [{ count }] = await countQuery.count("* as count");

            return {
                data,
                total: Number(count)
            };

        } catch (e) {
            throw new DatabaseError(e);
        }
    }

    async create(data) {
        try {
            const qb = await this.getQueryBuilder();
            const insertData = this.insertStatement(data);

            const [order] = await qb("orders")
                .insert(insertData)
                .returning(this.getPublicColumns());

            return order;
        } catch (e) {
            throw new DatabaseError(e);
        }
    }

    async findById(order_id) {
        try {
            const qb = await this.getQueryBuilder();

            // Select columns with joins to get all related details
            const selectColumns = [
                // Order columns
                "orders.order_id",
                "orders.product_id",
                "orders.shelf_id",
                "orders.rack_id",
                "orders.quantity",
                "orders.status",
                "orders.created_by",
                "orders.created_at",
                "orders.updated_at",
                // Product columns
                "products.name as product_name",
                "products.description as product_description",
                "products.sku as product_sku",
                "products.barcode as product_barcode",
                "products.vendor_id as product_vendor_id",
                "products.product_image",
                // User columns
                "users.name as user_name",
                // Shelf columns
                "shelf.shelf_name",
                "shelf.warehouse_id",
                "shelf.room_id",
                "shelf.capacity as shelf_capacity",
                // Rack columns
                "racks.rack_name",
                "racks.warehouse_id as rack_warehouse_id",
                "racks.room_id as rack_room_id",
                // Warehouse columns
                "warehouses.name as warehouse_name",
                "rack_warehouses.name as rack_warehouse_name",
                // Room columns
                "rooms.room_name",
                "rack_rooms.room_name as rack_room_name",
                // Category columns
                "category.category_name",
                qb.raw("(SELECT json_agg(json_build_object('date', sub.date, 'count', sub.count)) FROM (SELECT items.created_at::date as date, count(*) as count FROM items WHERE items.order_id = orders.order_id GROUP BY items.created_at::date) sub) as inward_dates")
            ];

            const order = await qb("orders")
                .select(selectColumns)
                .leftJoin("products", "orders.product_id", "products.product_id")
                .leftJoin("shelf", "orders.shelf_id", "shelf.shelf_id")
                .leftJoin("racks", "orders.rack_id", "racks.rack_id")
                .leftJoin("rooms", "shelf.room_id", "rooms.room_id")
                .leftJoin("warehouses", "shelf.warehouse_id", "warehouses.warehouse_id")
                .leftJoin("rooms as rack_rooms", "racks.room_id", "rack_rooms.room_id")
                .leftJoin("warehouses as rack_warehouses", "racks.warehouse_id", "rack_warehouses.warehouse_id")
                .leftJoin("category", "products.category_id", "category.category_id")
                .leftJoin("users", "orders.created_by", "users.user_id")
                .where("orders.order_id", order_id)
                .where("orders.is_deleted", false)
                .first();

            return order || null;
        } catch (e) {
            throw new DatabaseError(e);
        }
    }

    async totalOrder() {
        try {
            const qb = await this.getQueryBuilder();

            const result = await qb("orders")
                .where({ status: ORDER_STATUS.SOLD })
                .count("* as count")
                .first()


            return Number(result.count);

        } catch (e) {
            throw new DatabaseError(e);
        }

    }

    

    async getTopSellingProducts(limit = 10) {
    const qb = db.getQueryBuilder();

    return await qb('orders as o')
      .join('products as p', 'p.product_id', 'o.product_id')
      .where('o.status', 'sold')
      .select(
        'p.product_id',
        'p.name',
        'p.product_image'
      )
      .sum('o.quantity as total_sold')
      .groupBy(
        'p.product_id',
        'p.name',
        'p.product_image'
      )
      .orderBy('total_sold', 'desc')
      .limit(limit);
  }

  async getLeastSellingProducts(limit = 10) {
    const qb = db.getQueryBuilder();

    return await qb('orders as o')
      .join('products as p', 'p.product_id', 'o.product_id')
      .where('o.status', 'sold')
      .select(
        'p.product_id',
        'p.name',
        'p.product_image'
      )
      .sum('o.quantity as total_sold')
      .groupBy(
        'p.product_id',
        'p.name',
        'p.product_image'
      )
      .orderBy('total_sold', 'asc')
      .limit(limit);
  }



    async updateStatus(order_id, status) {
        try {
            const qb = await this.getQueryBuilder();

            const [updated] = await qb("orders")
                .where(this.whereStatement({ order_id }))
                .update({ status, updated_at: qb.fn.now() })
                .returning(this.getPublicColumns());

            return updated || null;
        } catch (e) {
            throw new DatabaseError(e);
        }
    }
}

module.exports = OrderModel;
