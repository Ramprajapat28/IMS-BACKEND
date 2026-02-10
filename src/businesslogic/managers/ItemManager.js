const ItemModel = require("../../models/ItemModel");
const ProductModel = require("../../models/productModel");
const OrderManager = require("./OrderManager");
const JoiValidatorError = require("../../errorhandlers/JoiValidationError");
const { ITEM_STATUS, ORDER_STATUS, ORDER_MODE } = require("../../models/libs/dbConstants");
const OrderModel = require("../../models/OrderModel");

const {
  createItemSchema,
  removeStockSchema,
  paginationSchema,
  transferStockSchema,
} = require("../../validators/itemValidator");

class itemManager {
  static async createItem({ product_id, shelf_id, quantity, remark, rack_id = null }) {
    try {
      const itemModel = new ItemModel();
      const productModel = new ProductModel();

      console.log("payload", { product_id, shelf_id, rack_id, quantity, remark });

      // 1. Verify product
      const Product = await productModel.findById(product_id);
      console.log("Product", Product);

      if (!Product) {
        return null; // product not found
      }

      if (quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
      }

      if (!shelf_id && !rack_id) {
        throw new Error("Either shelf_id or rack_id is required");
      }

      // 2. Insert items (1 row = 1 physical item)
      const createdItems = [];

      for (let i = 0; i < quantity; i++) {
        const item = await itemModel.create(
          {
            name: Product.name, // Product name for the item
            shelf_id: shelf_id || null,
            rack_id: rack_id || null,
            remark: remark || null, // 🆕 Add remark field (optional)
          },
          product_id
        );

        createdItems.push(item);
      }

      return createdItems; // return all created rows
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async removeItemStock(
    product_id,
    quantity,
    status = ITEM_STATUS.SOLD,
    order_id = null,
    shelf_id = null,
    rack_id = null,  // 🆕 Can sell from racks too
    mode = ORDER_MODE.ONLINE,
    userId = null
  ) {
    try {
      const itemModel = new ItemModel(userId);
      const orderModel = new OrderModel();

      product_id = Number(product_id);
      quantity = Number(quantity);

      const normalizedStatus = String(status).trim().toLowerCase();

      if (!Object.values(ITEM_STATUS).includes(normalizedStatus)) {
        throw new Error(`Invalid item status: ${normalizedStatus}`);
      }

      const isReturn = normalizedStatus === ITEM_STATUS.RETURNED || normalizedStatus === ITEM_STATUS.AVAILABLE;

      if (!isReturn && quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
      }

      // Validate that either shelf_id OR rack_id is provided (not both, not neither)
      if (!isReturn && !shelf_id && !rack_id) {
        throw new Error("Either shelf_id or rack_id is required");
      }
      if (shelf_id && rack_id) {
        throw new Error("Cannot specify both shelf_id and rack_id");
      }

      // Check stock only for sell/outward
      if (!isReturn) {
        const available = await itemModel.countByProductId(product_id);
        if (available < quantity) {
          throw new Error("Insufficient stock");
        }
      } else {
        // Check sold count for returns
        const soldCount = await itemModel.countSoldByProductId(product_id);
        if (soldCount < quantity) {
          throw new Error("Input quantity is more than total items sold");
        }
      }

      // Remove/return stock
      const affectedItemIds = await itemModel.softDelete(
        product_id,
        quantity,
        normalizedStatus,
        shelf_id,
        rack_id  // ✅ Pass rack_id to delete rack items
      );

      const affected = affectedItemIds.length;

      if (isReturn && affected === 0) {
        throw new Error("No sold items found to return");
      }

      // ✅ Create order if affected > 0 (sales and returns)
      let createdOrderId = order_id;
      if (affected > 0 && !order_id) {
        const orderData = {
          product_id,
          shelf_id: shelf_id || null,
          rack_id: rack_id || null,
          quantity,
          status: isReturn ? ORDER_STATUS.RETURNED : ORDER_STATUS.SOLD,
          mode,
          created_by: userId
        };

        const createdOrder = await orderModel.create(orderData);
        createdOrderId = createdOrder.order_id;

        // ✅ Link items to the newly created order (Always do this now to show inward dates)
        await itemModel.linkItemsToOrder(affectedItemIds, createdOrderId);
      }

      return {
        product_id,
        quantity,
        status: normalizedStatus,
        affected,
        order_id: createdOrderId,
      };
    } catch (error) {
      throw new Error(`Failed to remove stock: ${error.message}`);
    }
  }

  static async updateItemStatus(payload) {

    if (!payload || typeof payload !== "object") {
      throw new Error("Invalid payload");
    }

    if (!payload.status) {
      throw new Error("Status is required");
    }

    // Normalize ONLY for comparison
    const incomingStatus = String(payload.status).trim().toLowerCase();

    const allowedStatuses = Object.values(ITEM_STATUS);

    if (!allowedStatuses.includes(incomingStatus)) {
      throw new Error(`Invalid item status: ${payload.status}`);
    }

    // ✅ Store enum value (not user input)
    payload.status = incomingStatus;

    const itemModel = new ItemModel();
    return await itemModel.updateItemStatus(payload);
  }



  static async getItemCount(product_id) {
    try {
      const itemModel = new ItemModel();
      const count = await itemModel.countByProductId(product_id);
      return count;
    } catch (error) {
      throw new Error(`Failed to get item count: ${error.message}`);
    }
  }

  static async getItemsPaginated(product_id, page, limit) {
    try {
      const itemModel = new ItemModel();
      const result = await itemModel.findAllPaginated({ product_id }, page, limit);
      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(result.total / limit);

      return {
        items: result.data,
        page,
        limit,
        offset,
        total: result.total,
        totalPages,
        previous: page > 1 ? page - 1 : null,
        next: page < totalPages ? page + 1 : null,
      };
    } catch (error) {
      throw new Error(`Failed to get items: ${error.message}`);
    }
  }
  static async returnStock({ product_id, quantity, shelf_id, rack_id, userId = null }) {
    try {
      const itemModel = new ItemModel(userId);
      const productModel = new ProductModel();

      if (!product_id || !quantity) {
        throw new Error("product_id and quantity are required");
      }

      // Validate that either shelf_id OR rack_id is provided
      if (!shelf_id && !rack_id) {
        throw new Error("Either shelf_id or rack_id is required");
      }
      if (shelf_id && rack_id) {
        throw new Error("Cannot specify both shelf_id and rack_id");
      }

      // Verify product exists
      const product = await productModel.findById(product_id);
      if (!product) {
        throw new Error("Product not found");
      }

      // Use removeItemStock with RETURNED status to perform the return
      const result = await this.removeItemStock(
        product_id,
        quantity,
        ITEM_STATUS.AVAILABLE, // Status should be available after return
        null,  // order_id
        shelf_id,
        rack_id,
        ORDER_MODE.ONLINE, // default mode for returns if not specified
        userId
      );

      return {
        success: true,
        affected: result.affected,
        message: `Successfully returned ${result.affected} item(s)`
      };

    } catch (error) {
      throw new Error(`Failed to return stock: ${error.message}`);
    }
  }

  static async transferStock(payload) {
    const { error } = transferStockSchema.validate(payload);
    if (error) {
      throw new JoiValidatorError(error);
    }

    try {
      const itemModel = new ItemModel();
      const { product_id, quantity, source, destination } = payload;

      // 1. Perform Transfer in items table
      const affectedItemIds = await itemModel.transferItems(
        product_id,
        quantity,
        source,
        destination
      );

      // 2. Log movement
      try {
        const qb = await itemModel.getQueryBuilder();
        await qb("stock_movements").insert({
          product_id,
          quantity,
          source_type: source.shelf_id ? 'shelf' : 'rack',
          source_id: source.shelf_id || source.rack_id,
          dest_type: destination.shelf_id ? 'shelf' : 'rack',
          dest_id: destination.shelf_id || destination.rack_id,
          remark: payload.remark || 'Internal Transfer',
          created_at: qb.fn.now()
        });
      } catch (logError) {
        console.error("Failed to log stock movement:", logError.message);
      }

      return {
        success: true,
        affected: affectedItemIds.length,
        message: `Successfully transferred ${affectedItemIds.length} item(s)`
      };
    } catch (error) {
      throw new Error(`Failed to transfer stock: ${error.message}`);
    }
  }
}

module.exports = itemManager;
