const express = require("express");
const AuthenticationManager = require("../../businesslogic/managers/AuthenticationManager");
const { appWrapper } = require("../routeWrapper");
const { ACCESS_ROLES } = require("../../businesslogic/accessmanagement/roleConstants");

const router = express.Router();

/**
 * POST /register_user
 * Registers a new user in the system.
 * Body: { email, password, name, role, etc. }
 * Access: ALL
 */
router.post(
  "/register_user",
  appWrapper(
    async (req, res) => {
      const user = await AuthenticationManager.register(req.body);

      return res.json({
        success: true,
        user: user,
        message: "Registration successful"
      });
    },
    [ACCESS_ROLES.ALL]
  )
);

module.exports = router;




