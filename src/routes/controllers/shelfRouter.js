const express = require("express");
const { appWrapper } = require("../routeWrapper");
const { ACCESS_ROLES } = require("../../businesslogic/accessmanagement/roleConstants");
const shelfManager = require("../../businesslogic/managers/ShelfManager");

const router = express.Router({ mergeParams: true });

router.get(
  "/get_all_shelfs",
  appWrapper(async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await shelfManager.getAllShelfPaginated(page, limit);

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


router.post(
  "/create_shelf",
  appWrapper(async (req) => ({
    success: true,
    shelf: await shelfManager.createShelf(req.body),
    message: "Shelf created successfully"
  }), [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

router.get(
  "/get_shelf/:id",
  appWrapper(async (req) => {
    const shelf = await shelfManager.getShelfById(req.params);
    return shelf
      ? { success: true, shelf: shelf }
      : { success: false, message: "Shelf not found or already deleted" };
  }, [ACCESS_ROLES.ALL])
);

router.put(
  "/update_shelf/:id",
  appWrapper(async (req) => {
    const shelf = await shelfManager.updateShelf(req.params, req.body);
    return shelf
      ? { success: true, updated_shelf: shelf, message: "Shelf updated successfully" }
      : { success: false, message: "Shelf not found or nothing to update" };
  }, [ACCESS_ROLES.ACCOUNT_ADMIN, ACCESS_ROLES.ACCOUNT_SUPER_ADMIN])
);

router.post(
  "/delete_shelf/:id",
  appWrapper(async (req) => {
    const deleted = await shelfManager.deleteShelf(req.params);
    return deleted
      ? { success: true, deleted_shelf: deleted, message: "Shelf deleted successfully" }
      : { success: false, message: "Shelf not found or already deleted" };
  }, [ACCESS_ROLES.ALL])
);

module.exports = router;
