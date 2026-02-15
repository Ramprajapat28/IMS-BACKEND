const express = require("express");
const { appWrapper } = require("../routeWrapper");
const { ACCESS_ROLES } = require("../../businesslogic/accessmanagement/roleConstants");
const VendorManager = require("../../businesslogic/managers/VendorManager");

const router = express.Router({ mergeParams: true });

/**
 * GET /get_all_vendors
 * Retrieves all vendors with pagination.
 * Query: page, limit
 * Access: ALL
 */
router.get(
  "/get_all_vendors",
  appWrapper(
    async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await VendorManager.getAllVendorsPaginated(page, limit);

      if (!result.vendors || result.vendors.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No vendors found"
        });
      }

      return {
        success: true,
        vendors: result.vendors,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          offset: result.offset,
          previous: result.previous,
          next: result.next
        }
      };
    },
    [ACCESS_ROLES.ALL]
  )
);


/**
 * POST /create_vendor
 * Creates a new vendor.
 * Body: { name, contact_person, email, etc. }
 * Access: ALL
 */
router.post(
  "/create_vendor",
  appWrapper(async (req) => ({
    success: true,
    vendor: await VendorManager.createVendor(req.body),
    message: "Vendor created successfully"
  }), [ACCESS_ROLES.ALL])
);

/**
 * GET /get_vendor/:id
 * Retrieves a specific vendor by its ID.
 * Params: id
 * Access: ALL
 */
router.get(
  "/get_vendor/:id",
  appWrapper(async (req) => {
    const vendor = await VendorManager.getVendorById(req.params);
    return vendor
      ? { success: true, vendor }
      : { success: false, message: "Vendor not found or already deleted" };
  }, [ACCESS_ROLES.ALL])
);

/**
 * PUT /update_vendor/:id
 * Updates an already existing vendor.
 * Params: id
 * Body: { ...vendorData }
 * Access: ALL
 */
router.put(
  "/update_vendor/:id",
  appWrapper(async (req) => {
    const vendor = await VendorManager.updateVendor(req.params, req.body);
    return vendor
      ? { success: true, updated_vendor: vendor, message: "Vendor updated successfully" }
      : { success: false, message: "Vendor not found or nothing to update" };
  }, [ACCESS_ROLES.ALL])
);

/**
 * DELETE /delete_vendor/:id
 * Deletes a vendor by its ID.
 * Params: id
 * Access: ALL
 */
router.delete(
  "/delete_vendor/:id",
  appWrapper(async (req) => {
    const deleted = await VendorManager.deleteVendor(req.params);
    return deleted
      ? { success: true, deleted_vendor: deleted, message: "Vendor deleted successfully" }
      : { success: false, message: "Vendor not found or already deleted" };
  }, [ACCESS_ROLES.ALL])
);

module.exports = router;
