const express = require("express");
const router = express.Router({ mergeParams: true });

const itemManager = require("../../businesslogic/managers/ItemManager");
const { appWrapper } = require("../routeWrapper");
const { ACCESS_ROLES } = require("../../businesslogic/accessmanagement/roleConstants");


// POST /items/addStock - Add stock for a product
router.post(
  "/addStock",
  // validate(validators.createProductSchema),
  appWrapper(
    async (req, res) => {
      console.log("add item:", req.body);

      const { quantity, shelf_id, rack_id, product_id, remark } = req.body;
      const item = await itemManager.createItem({ product_id, shelf_id, quantity, remark, rack_id });
      console.log("item", item);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: "product doesnt exist",
        });
      }
      console.log("Item(s) created:", item);
      return res.json({
        success: true,
        data: item,
        message: "Item(s) created successfully",
      });
    },
    [ACCESS_ROLES.ALL]
  )
);

router.post(
  "/removeStock",
  appWrapper(
    async (req, res) => {
      const {
        product_id,
        quantity,
        status,
        order_id,
        shelf_id,
        rack_id,
        mode
      } = req.body;

      // Validate that either shelf_id or rack_id is provided
      if (!shelf_id && !rack_id) {
        return res.status(400).json({
          success: false,
          message: "Either shelf_id or rack_id is required",
        });
      }

      try {
        const item = await itemManager.removeItemStock(
          product_id,
          quantity,
          status,
          order_id,
          shelf_id,
          rack_id,
          mode
        );

        if (!item) {
          return res.status(404).json({
            success: false,
            message: "Item not found or insufficient stock",
          });
        }

        return res.json({
          success: true,
          data: item,
          message: "Item(s) removed successfully",
        });

      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Failed to remove stock",
        });
      }

    },
    [ACCESS_ROLES.ALL]
  )
);


router.post(
  "/return-stock",
  appWrapper(
    async (req, res) => {
      const { product_id, quantity, shelf_id, rack_id } = req.body;

      // Validate that either shelf_id or rack_id is provided
      if (!shelf_id && !rack_id) {
        return res.status(400).json({
          success: false,
          message: "Either shelf_id or rack_id is required",
        });
      }

      try {
        const result = await itemManager.returnStock({
          product_id: Number(product_id),
          quantity: Number(quantity),
          shelf_id: shelf_id ? Number(shelf_id) : undefined,
          rack_id: rack_id ? Number(rack_id) : undefined
        });

        return res.json({
          success: true,
          data: result,
          message: result.message,
        });

      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Failed to return stock",
        });
      }
    },
    [ACCESS_ROLES.ALL]
  )
);


router.post(
  "/outward-scan",
  appWrapper(async (req, res) => {
    const { item_id, status } = req.body;

    if (!item_id || !status) {
      return res.status(400).json({
        success: false,
        message: "item_id and status are required",
      });
    }

    // 🚀 Normalize status here OR in manager (both ok)
    const normalizedStatus = status.toUpperCase();

    const updatedItem = await itemManager.updateItemStatus({
      item_id,
      status: normalizedStatus,
    });

    return res.json({
      success: true,
      data: updatedItem,
      message: `Item marked as ${normalizedStatus}`,
    });
  })
);


router.get(
  "/count/:product_id",
  appWrapper(
    async (req, res) => {
      const { product_id } = req.params;
      const count = await itemManager.getItemCount(product_id);
      console.log("Item count:", count);
      return res.json({
        success: true,
        data: { product_id, count },
        message: "Item count retrieved successfully",
      });
    },
    [ACCESS_ROLES.ALL]
  )
);

router.get(
  "/all",
  appWrapper(async (req, res) => {
    const { product_id } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "product_id is required",
      });
    }

    const result = await itemManager.getItemsPaginated(product_id, page, limit);

    if (!result.items || result.items.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No items found",
      });
    }

    return res.json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        offset: result.offset,
        total: result.total,
        totalPages: result.totalPages,
        previous: result.previous,
        next: result.next,
      },
    });
  })
);

module.exports = router;
