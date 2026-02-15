const express = require("express");
const { appWrapper } = require("../routeWrapper");
const { ACCESS_ROLES } = require("../../businesslogic/accessmanagement/roleConstants");
const shelfManager = require("../../businesslogic/managers/ShelfManager");

const router = express.Router({ mergeParams: true });

/**
 * GET /get_all_shelfs
 * Retrieves all shelves with pagination.
 * Query: page, limit
 * Access: ALL
 */
router.get(
  "/get_all_shelfs",
  appWrapper(async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await shelfManager.getAllShelfPaginated(page, limit, res.locals.userInfo?.user?.user_id);

    // if (!result.shelfs || result.shelfs.length === 0) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "No shelves found"
    //   });
    // }

    return res.json({
      success: true,
      data: result.shelfs,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        offset: result.offset,
        previous: result.previous,
        next: result.next
      }
    });
  }, [ACCESS_ROLES.ALL])
);


/**
 * POST /create_shelf
 * Creates a new shelf.
 * Body: { shelf_name, rack_id, etc. }
 * Access: ACCOUNT_ADMIN, ACCOUNT_SUPER_ADMIN
 */
router.post(
  "/create_shelf",
  appWrapper(async (req, res) => ({
    success: true,
    shelf: await shelfManager.createShelf(req.body, res.locals.userInfo?.user?.user_id),
    message: "Shelf created successfully"
  }), [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

/**
 * GET /get_shelf/:id
 * Retrieves a specific shelf by its ID.
 * Params: id
 * Access: ALL
 */
router.get(
  "/get_shelf/:id",
  appWrapper(async (req, res) => {
    const shelf = await shelfManager.getShelfById(req.params, res.locals.userInfo?.user?.user_id);
    return shelf
      ? { success: true, shelf: shelf }
      : { success: false, message: "Shelf not found or already deleted" };
  }, [ACCESS_ROLES.ALL])
);

/**
 * PUT /update_shelf/:id
 * Updates an existing shelf.
 * Params: id
 * Body: { ...shelfData }
 * Access: ACCOUNT_ADMIN, ACCOUNT_SUPER_ADMIN
 */
router.put(
  "/update_shelf/:id",
  appWrapper(async (req, res) => {
    const shelf = await shelfManager.updateShelf(req.params, req.body, res.locals.userInfo?.user?.user_id);
    return shelf
      ? { success: true, updated_shelf: shelf, message: "Shelf updated successfully" }
      : { success: false, message: "Shelf not found or nothing to update" };
  }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

/**
 * DELETE /delete_shelf/:id
 * Deletes a shelf by its ID.
 * Params: id
 * Access: ALL
 */
router.delete(
  "/delete_shelf/:id",
  appWrapper(async (req, res) => {
    const deleted = await shelfManager.deleteShelf(req.params, res.locals.userInfo?.user?.user_id);
    return deleted
      ? { success: true, deleted_shelf: deleted, message: "Shelf deleted successfully" }
      : { success: false, message: "Shelf not found or already deleted" };
  }, [ACCESS_ROLES.ALL])
);

module.exports = router;
