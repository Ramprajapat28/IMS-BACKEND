const express = require("express");
const router = express.Router({ mergeParams: true });
const { appWrapper } = require("../routeWrapper");
const { ACCESS_ROLES } = require("../../businesslogic/accessmanagement/roleConstants");
const WarehouseManager = require("../../businesslogic/managers/WarehouseManager");

// GET WAREHOUSE → ROOMS → SHELVES
// router.post(
//   "/manage/by-ids",
//   appWrapper(async (req) => {
//     const userId = req.locals?.user?.user_id
//       || req._locals?.user?.user_id
//       || req.auth?.user_id;

//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;

//     const result = await WarehouseManager.getWarehouseById(
//       req.body,
//       userId,
//       page,
//       limit
//     );

//     return {
//       success: true,
//       data: result.data,
//       pagination: {
//         page: result.page,
//         limit: result.limit,
//         offset: result.offset,
//         total: result.total,
//         totalPages: result.totalPages,
//         previous: result.previous,
//         next: result.next
//       }
//     };

// const data = await WarehouseManager.getWarehouseDetailsByIds(
//   req.body,
//   userId
// );


//   }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
// );

/**
 * GET /get_all_warehouses
 * Retrieves all warehouses with pagination.
 * Query: page, limit
 * Access: ALL
 */
router.get(
  "/get_all_warehouses",
  appWrapper(async (req, res) => {
    const userId = res.locals.userInfo?.user?.user_id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await WarehouseManager.getAllWarehousesPaginated(
      page,
      limit,
      userId
    );

    return {
      success: true,
      data: result.warehouses,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    };
  }, [ACCESS_ROLES.ALL])
);



/**
 * GET /:id
 * Retrieves a single warehouse by its ID.
 * Params: id
 * Access: ALL
 */
router.get(
  "/:id",
  appWrapper(async (req, res) => {
    const userId = res.locals.userInfo?.user?.user_id;

    const { id } = req.params;
    const warehouse = await WarehouseManager.getWarehouseById(
      Number(id),
      userId
    );

    return {
      success: true,
      data: warehouse
    };
  }, [ACCESS_ROLES.ALL])
);

/**
 * POST /create
 * Creates a new warehouse.
 * Body: { name, address, etc. }
 * Access: ACCOUNT_ADMIN, ACCOUNT_SUPER_ADMIN
 */
router.post(
  "/create",
  appWrapper(async (req, res) => {
    const userId = res.locals.userInfo?.user?.user_id;

    const warehouse = await WarehouseManager.createWarehouse(
      req.body,
      userId
    );

    return {
      success: true,
      data: warehouse,
      message: "Warehouse created successfully"
    };
  }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

/**
 * PUT /update/:id
 * Updates an already existing warehouse.
 * Params: id
 * Body: { ...warehouseData }
 * Access: ACCOUNT_ADMIN, ACCOUNT_SUPER_ADMIN
 */
router.put(
  "/update/:id",
  appWrapper(async (req, res) => {
    const userId = res.locals.userInfo?.user?.user_id;

    const { id } = req.params;
    const warehouse = await WarehouseManager.updateWarehouse(
      Number(id),
      req.body,
      userId
    );

    return {
      success: true,
      data: warehouse,
      message: "Warehouse updated successfully"
    };
  }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

/**
 * DELETE /delete/:id
 * Deletes a warehouse by its ID (soft delete).
 * Params: id
 * Access: ACCOUNT_ADMIN, ACCOUNT_SUPER_ADMIN
 */
router.delete(
  "/delete/:id",
  appWrapper(async (req, res) => {
    const userId = res.locals.userInfo?.user?.user_id;

    const { id } = req.params;
    const warehouse = await WarehouseManager.deleteWarehouse(
      Number(id),
      userId
    );

    return {
      success: true,
      data: warehouse,
      message: "Warehouse deleted successfully"
    };
  }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

module.exports = router;
