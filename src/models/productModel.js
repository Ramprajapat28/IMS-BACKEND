const BaseModel = require("../models/libs/BaseModel");
const DatabaseError = require("../errorhandlers/DatabaseError");
const { TABLE_DEFAULTS } = require("../models/libs/dbConstants");

class ProductModel extends BaseModel {
  constructor(userId) {
    super(userId);
    this.tableName = "products";
  }

  /**
   * ✅ ONLY product table columns here
   */
  getPublicColumns() {
    return [
      "product_id",
      "name",
      "description",
      "vendor_id",
      "sku",
      "barcode",
      "product_image",
      "barcode_image",
      "size",
      "category_id",
      "mrp",
      "discounted_price",
      "gst_percentage",
      "cost_to_company",
      "reorder_level"
    ];
  }

  getPrivateColumns() {
    return [
      "product_id",
      "name",
      "description",
      "vendor_id",
      "sku",
      "barcode",
      "product_image",
      "barcode_image",
      "size",
      "products.category_id",
      "category_name",
      "product_code_id",
      "mrp",
      "discounted_price",
      "gst_percentage",
      "cost_to_company",
      "reorder_level"
    ];
  }

  /**
   * ✅ Get all products with category name
   * Normalize product to ensure consistent JSONB structure
   */
  normalizeProduct(product) {
    return {
      ...product,
      product_image: product.product_image || [],   // always array
      barcode_image: product.barcode_image || null // always object
    };
  }

  /**
   * Get all products with pagination
   */
  async findAllPaginated(page = 1, limit = 10, search = "") {
    try {
      const qb = await this.getQueryBuilder();
      const offset = (page - 1) * limit;

      const applySearch = (query) => {
        if (search) {
          query.where(function () {
            this.where("products.name", "ilike", `%${search}%`)
              .orWhere("products.sku", "ilike", `%${search}%`)
              .orWhere("product_codes.code", "ilike", `%${search}%`);
          });
        }
      };

      const query = qb("products")
        .select([
          "products.product_id",
          "products.name",
          "products.description",
          "products.vendor_id",
          "products.sku",
          "products.barcode",
          "products.product_image",
          "products.barcode_image",
          "products.size",
          "products.category_id",
          "products.mrp",
          "products.discounted_price",
          "products.gst_percentage",
          "products.cost_to_company",
          "products.reorder_level",
          "category.category_name as category_name",
          "category.global_category_id as global_category_id",
          "gc.category_name as global_category_name",
          "product_codes.code as product_code",
          qb.raw("(SELECT MAX(created_at) FROM items WHERE items.product_id = products.product_id AND items.is_deleted = false) as last_added_date")
        ])
        .leftJoin("category", "products.category_id", "category.category_id")
        .leftJoin("public.global_category as gc", "category.global_category_id", "gc.global_category_id")
        .leftJoin("product_codes", "products.product_code_id", "product_codes.id")
        .where("products.is_deleted", false);

      applySearch(query);

      const data = await query
        .orderBy("products.product_id", "asc")
        .limit(limit)
        .offset(offset);

      const countQuery = qb("products")
        .leftJoin("product_codes", "products.product_code_id", "product_codes.id")
        .where("products.is_deleted", false);

      applySearch(countQuery);

      const [{ count }] = await countQuery.count("* as count");

      return {
        data: data.map(this.normalizeProduct),
        total: Number(count),
      };
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  /**
   * ✅ Products by category
   */
  async findByCategoryIdPaginated(category_id, page = 1, limit = 10) {
    try {
      const qb = await this.getQueryBuilder();
      const offset = (page - 1) * limit;

      const data = await qb("products")
        .select([
          "products.product_id",
          "products.name",
          "products.description",
          "products.vendor_id",
          "products.sku",
          "products.barcode",
          "products.product_image",
          "products.barcode_image",
          "products.size",
          "products.category_id",
          "products.mrp",
          "products.discounted_price",
          "products.gst_percentage",
          "products.cost_to_company",
          "products.reorder_level",
          "category.category_name as category_name",
          "gc.category_name as global_category_name",
          qb.raw("(SELECT MAX(created_at) FROM items WHERE items.product_id = products.product_id AND items.is_deleted = false) as last_added_date")
        ])
        .leftJoin("category", "products.category_id", "category.category_id")
        .leftJoin("public.global_category as gc", "category.global_category_id", "gc.global_category_id")
        .where({
          "products.category_id": category_id,
          "products.is_deleted": false,
        })
        .orderBy("products.product_id", "asc")
        .limit(limit)
        .offset(offset);

      const [{ count }] = await qb("products")
        .where({
          category_id,
          is_deleted: false,
        })
        .count("* as count");

      return {
        data,
        total: Number(count),
      };
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async countTotalProducts() {
    try {
      const qb = await this.getQueryBuilder();

      const [{ count }] = await qb("products")
        .where("is_deleted", false)
        .count("* as count");

      return Number(count);
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  /**
   * ✅ Get product by ID (with category name)
   */
  async findById(product_id) {
    try {
      const qb = await this.getQueryBuilder();

      return (
        (await qb("products")
          .select([
            "products.product_id",
            "products.name",
            "products.description",
            "products.vendor_id",
            "products.sku",
            "products.barcode",
            "products.product_image",
            "products.barcode_image",
            "products.size",
            "products.category_id",
            "products.mrp",
            "products.discounted_price",
            "products.gst_percentage",
            "products.cost_to_company",
            "products.reorder_level",
            "category.category_name as category_name",
            "category.global_category_id as global_category_id",
            "gc.category_name as global_category_name",
            "product_codes.code as product_code",
            qb.raw("(SELECT MAX(created_at) FROM items WHERE items.product_id = products.product_id AND items.is_deleted = false) as last_added_date")
          ])
          .leftJoin("category", "products.category_id", "category.category_id")
          .leftJoin("public.global_category as gc", "category.global_category_id", "gc.global_category_id")
          .leftJoin("product_codes", "products.product_code_id", "product_codes.id")
          .where({
            "products.product_id": product_id,
            "products.is_deleted": false,
          })
          .first()) || null
      );
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  /**
   * ✅ Create product
   */
  async create(productData) {
    try {
      const qb = await this.getQueryBuilder();

      // Normalize JSONB fields
      if (!productData.product_image) productData.product_image = [];
      if (!productData.barcode_image) productData.barcode_image = null;

      const data = this.insertStatement(productData);

      const [product] = await qb("products")
        .insert(data)
        .returning(this.getPublicColumns());

      return product ? this.normalizeProduct(product) : null;
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  /**
   * ✅ Update product
   */
  async update(product_id, productData) {
    try {
      const qb = await this.getQueryBuilder();
      const data = await this.updateStatement(productData);

      if (!data || Object.keys(data).length === 0) return null;

      // If fields not provided, leave them undefined
      if (data.product_image === undefined) data.product_image = undefined;
      if (data.barcode_image === undefined) data.barcode_image = undefined;

      const updatedRows = await qb("products")
        .where({ product_id })
        .update({
          ...data,
          [TABLE_DEFAULTS.COLUMNS.UPDATED_AT.KEY]: qb.raw("CURRENT_TIMESTAMP"),
        });

      if (!updatedRows) {
        return null;
      }

      return this.findById(product_id);
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  /**
   * ✅ Soft delete
   */
  async softDelete(product_id) {
    try {
      const qb = await this.getQueryBuilder();

      return qb("products")
        .where({ product_id })
        .update({
          is_deleted: true,
          [TABLE_DEFAULTS.COLUMNS.UPDATED_AT.KEY]: qb.raw("CURRENT_TIMESTAMP"),
        });
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async findBySkuId(sku) {
    try {
      const qb = await this.getQueryBuilder();

      return ((
        await qb("products")
          .select([
            ...this.getPrivateColumns(),
            "category.global_category_id as global_category_id"
          ])
          .leftJoin("category", "products.category_id", "category.category_id")
          .where("products.sku", sku)
          .where("products.is_deleted", false)
          .first()) || null
      );
    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async findByBarcode(barcode) {
    try {
      const qb = await this.getQueryBuilder();

      return (
        (await qb("products")
          .select(this.getPublicColumns())
          .where({ barcode, is_deleted: false })
          .first()) || null
      );

    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  /**
   * ✅ NEW: Get products by Category with STOCK QUANTITY (subquery)
   */
  async findByCategoryIdWithStockPaginated(category_id, page = 1, limit = 10) {
    try {
      const qb = await this.getQueryBuilder();
      const offset = (page - 1) * limit;

      const data = await qb("products")
        .select([
          "products.product_id",
          "products.name",
          "products.description",
          "products.sku",
          "products.product_image",
          "products.category_id",
          "products.mrp",
          "products.discounted_price",
          "category.category_name as category_name",
          qb.raw(
            "(SELECT count(*) FROM items WHERE items.product_id = products.product_id AND items.status = 'available') as stock_quantity"
          ),
        ])
        .leftJoin("category", "products.category_id", "category.category_id")
        .where({
          "products.category_id": category_id,
          "products.is_deleted": false,
        })
        .orderBy("products.product_id", "asc")
        .limit(limit)
        .offset(offset);

      const [{ count }] = await qb("products")
        .where({
          category_id,
          is_deleted: false,
        })
        .count("* as count");

      return {
        data,
        total: Number(count),
      };

    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async findByCodeIdWithStock(product_code_id) {
    try {
      const qb = await this.getQueryBuilder();

      const data = await qb("products")
        .select([
          "products.product_id",
          "products.name",
          "products.description",
          "products.sku",
          "products.product_image",
          "products.size", // Added size
          "products.category_id",
          "products.mrp",
          "products.discounted_price",
          "category.category_name as category_name",
          "product_codes.code as product_code",
          qb.raw(
            "(SELECT count(*) FROM items WHERE items.product_id = products.product_id AND items.status = 'available') as stock_quantity"
          ),
        ])
        .leftJoin("category", "products.category_id", "category.category_id")
        .leftJoin("product_codes", "products.product_code_id", "product_codes.id")
        .where({
          "products.product_code_id": product_code_id,
          "products.is_deleted": false,
        })
        .orderBy("products.product_id", "asc");

      return data;
    } catch (e) {
      throw new DatabaseError(e);
    }
  }
  /**
   * ✅ Get Inventory for a Category (Grouped by Code)
   */
  async findCategoryInventory(category_id, page = 1, limit = 10, search = "") {
    try {
      const qb = await this.getQueryBuilder();
      const offset = (page - 1) * limit;

      // 1. Grouped Products Query
      const groupedQuery = qb("products")
        .select([
          "product_codes.id as id",
          "product_codes.name as name",
          "product_codes.code as sku", // Use code as SKU
          "category.category_name as category_name",
          qb.raw("'group' as type"),
          qb.raw("NULL as product_image"), // Could pick one image, for now null
          qb.raw("SUM((SELECT count(*) FROM items WHERE items.product_id = products.product_id AND items.status = 'available'))::integer as stock_quantity"),
          qb.raw("COUNT(products.product_id)::integer as variant_count"),
          qb.raw("MIN(products.mrp) as mrp"),
          qb.raw("MIN(products.discounted_price) as discounted_price"),
          qb.raw("MIN(products.product_id) as single_id"),
          qb.raw("MIN(products.sku) as single_sku")
        ])
        .join("product_codes", "products.product_code_id", "product_codes.id")
        .leftJoin("category", "products.category_id", "category.category_id")
        .where({
          "products.category_id": category_id,
          "products.is_deleted": false
        })
        .groupBy("product_codes.id", "product_codes.name", "product_codes.code", "category.category_name");

      if (search) {
        groupedQuery.andWhere(function () {
          this.where("product_codes.name", "ilike", `%${search}%`)
            .orWhere("product_codes.code", "ilike", `%${search}%`);
        });
      }

      // 2. Standalone Products Query
      const standaloneQuery = qb("products")
        .select([
          "products.product_id as id",
          "products.name",
          "products.sku",
          "category.category_name as category_name",
          qb.raw("'product' as type"),
          "products.product_image",
          qb.raw("(SELECT count(*) FROM items WHERE items.product_id = products.product_id AND items.status = 'available')::integer as stock_quantity"),
          qb.raw("1 as variant_count"),
          "products.mrp",
          "products.discounted_price",
          qb.raw("NULL::integer as single_id"),
          qb.raw("NULL::text as single_sku")
        ])
        .leftJoin("category", "products.category_id", "category.category_id")
        .where({
          "products.category_id": category_id,
          "products.is_deleted": false
        })
        .whereNull("products.product_code_id");

      if (search) {
        standaloneQuery.andWhere(function () {
          this.where("products.name", "ilike", `%${search}%`)
            .orWhere("products.sku", "ilike", `%${search}%`);
        });
      }

      // 3. Combine using Union
      const unionQuery = qb.union([groupedQuery, standaloneQuery], true);

      // 4. Paginate the Union
      const data = await qb.from(function () {
        this.from(unionQuery.as("combined_inventory"));
      })
        .orderBy("name", "asc")
        .limit(limit)
        .offset(offset);

      // 5. Get Total Count
      const countResult = await qb.from(function () {
        this.from(unionQuery.as("combined_count"));
      }).count("* as count");

      const total = Number(countResult[0]?.count || 0);

      return {
        data: data.map(item => ({
          ...item,
          stock_quantity: Number(item.stock_quantity || 0), // Ensure number
          product_image: typeof item.product_image === 'string' ? JSON.parse(item.product_image) : (item.product_image || [])
        })),
        total
      };

    } catch (e) {
      throw new DatabaseError(e);
    }
  }

  async getStockLogsAggregated(product_id, page = 1, limit = 10) {
    try {
      const qb = await this.getQueryBuilder();
      const offset = (page - 1) * limit;

      const itemsQuery = qb("items")
        .select(qb.raw("DATE(items.created_at) as date"))
        .select(qb.raw("'Added' as activity"))
        .select(qb.raw("COUNT(*)::integer as quantity"))
        .select(qb.raw("'Received' as status"))
        .select(qb.raw("'New Stock Received' as remark"))
        .select("users.name as user_name")
        .leftJoin("users", "items.created_by", "users.user_id")
        .where({ "items.product_id": product_id, "items.is_deleted": false })
        .groupByRaw("DATE(items.created_at), users.name");

      const ordersQuery = qb("orders")
        .select(qb.raw("DATE(orders.created_at) as date"))
        .select(qb.raw("'Returned' as activity"))
        .select(qb.raw("SUM(quantity)::integer as quantity"))
        .select(qb.raw("'Restocked' as status"))
        .select(qb.raw("'Order Return' as remark"))
        .select("users.name as user_name")
        .leftJoin("users", "orders.created_by", "users.user_id")
        .where({ "orders.product_id": product_id, status: 'returned', "orders.is_deleted": false })
        .groupByRaw("DATE(orders.created_at), users.name");

      const movementsQuery = qb("stock_movements")
        .select(qb.raw("DATE(stock_movements.created_at) as date"))
        .select(qb.raw("'Transferred' as activity"))
        .select(qb.raw("SUM(quantity)::integer as quantity"))
        .select(qb.raw("'Relocated' as status"))
        .select(qb.raw("MAX(remark) as remark"))
        .select("users.name as user_name")
        .leftJoin("users", "stock_movements.created_by", "users.user_id")
        .where({ "stock_movements.product_id": product_id })
        .groupByRaw("DATE(stock_movements.created_at), users.name");

      const unionQuery = qb.unionAll([itemsQuery, ordersQuery, movementsQuery], true);

      const data = await qb
        .from(unionQuery.as("combined_logs"))
        .select("*")
        .orderBy("date", "desc")
        .limit(limit)
        .offset(offset);

      const countResult = await qb
        .from(unionQuery.as("combined_count"))
        .count("* as total");

      const total = Number(countResult[0]?.total || 0);

      return {
        data: data.map((row, index) => ({
          ...row,
          id: `${row.activity.toLowerCase()}-${row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date}-${index}`,
          date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date
        })),
        total
      };
    } catch (e) {
      throw new DatabaseError(e);
    }
  }
}

module.exports = ProductModel;
