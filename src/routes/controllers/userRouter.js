const express = require("express");
const router = express.Router({ mergeParams: true });
const UserManager = require("../../businesslogic/managers/UserManager");
const { appWrapper } = require("../routeWrapper");

/**
 * PUT /profile/update/:id
 * Updates a user's profile information.
 * Params: id
 * Body: { name, email, etc. }
 */
router.put(
  "/profile/update/:id",
  appWrapper(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const updatedUser = await UserManager.profileUpdate(id, req.body);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found or no fields to update",
      });
    }

    return res.json({
      success: true,
      data: updatedUser,
      message: "User profile updated successfully",
    });
  }));


/**
 * GET /profile/:id
 * Retrieves a user's profile information by their ID.
 * Params: id
 */
router.get("/profile/:id",
  appWrapper(async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await UserManager.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: user,
      message: "User profile retrieved successfully",
    });
  }));


module.exports = router;