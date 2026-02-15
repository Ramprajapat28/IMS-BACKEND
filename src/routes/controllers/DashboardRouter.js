const DashboardManager = require('../../businesslogic/managers/DashboardManager');
const { appWrapper } = require('../routeWrapper');
const express = require('express');
const router = express.Router();
const { ACCESS_ROLES } = require('../../businesslogic/accessmanagement/roleConstants');

/**
 * GET /top-selling
 * Retrieves the top 10 selling products.
 * Access: ACCOUNT_SUPER_ADMIN
 */
router.get(
  '/top-selling',
  appWrapper(async (req, res) => {
    const data = await DashboardManager.getTopSellingProducts(10, res.locals.userInfo?.user?.user_id);
    return { success: true, data };
  }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN]
  ));

/**
 * GET /least-selling
 * Retrieves the top 10 least selling products.
 * Access: ACCOUNT_SUPER_ADMIN
 */
router.get(
  '/least-selling',
  appWrapper(async (req, res) => {
    const data = await DashboardManager.getLeastSellingProducts(10, res.locals.userInfo?.user?.user_id);
    return { success: true, data };
  }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

/**
 * GET /total_products
 * Retrieves the total count of products.
 * Access: ACCOUNT_SUPER_ADMIN
 */
router.get(
  "/total_products",
  appWrapper(async (req, res) => {
    const data = await DashboardManager.totalProducts(res.locals.userInfo?.user?.user_id);
    return {
      success: true,
      data
    };
  }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
)

/**
 * GET /total_order
 * Retrieves the total count of orders.
 * Access: ACCOUNT_SUPER_ADMIN
 */
router.get(
  "/total_order",
  appWrapper(async (req, res) => {
    const data = await DashboardManager.totalOrder(res.locals.userInfo?.user?.user_id);
    return {
      success: true,
      data
    };
  }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
)

/**
 * GET /stock-status
 * Retrieves detail of low and out-of-stock items.
 * Query: lowStock (limit for low stock)
 * Access: ACCOUNT_SUPER_ADMIN
 */
router.get("/stock-status", appWrapper(async (req, res) => {

  const lowStockLimit = Number(req.query.lowStock ?? 10);

  const data = await DashboardManager.getDetailOfLowAndOutOfStock(lowStockLimit, res.locals.userInfo?.user?.user_id);

  return {
    success: true,
    message: "Stock status fetched successfully",
    data
  };

}, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);


/**
 * GET /category_count
 * Retrieves product count grouped by category.
 * Access: ACCOUNT_SUPER_ADMIN
 */
router.get(
  "/category_count",
  appWrapper(async (req, res) => {
    const data = await DashboardManager.getProductCountByCategory(res.locals.userInfo?.user?.user_id);

    return {
      success: true,
      message: "Product count by category fetched successfully",
      data
    };
  }, [ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

module.exports = router;