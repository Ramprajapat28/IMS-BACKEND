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

// GET ALL WAREHOUSES
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



// GET SINGLE WAREHOUSE BY ID
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

// CREATE WAREHOUSE
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

// UPDATE WAREHOUSE
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

// DELETE WAREHOUSE (soft delete)
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
