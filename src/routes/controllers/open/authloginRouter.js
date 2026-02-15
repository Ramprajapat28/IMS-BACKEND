const express = require("express");
const router = express.Router();
const AuthenticationManager = require("../../../businesslogic/managers/AuthenticationManager");
const { appWrapper } = require("../../routeWrapper");
const { ACCESS_ROLES } = require("../../../businesslogic/accessmanagement/roleConstants");


/**
 * POST /login_user
 * Logs in a user based on email and password.
 * Body: { email, password }
 */
router.post(
  "/login_user",
  appWrapper(async (req, res) => {
    const result = await AuthenticationManager.login(
      req.body.email,
      req.body.password
    );

    return res.json({
      success: true,
      ...result,
      message: "Login successful"
    });
  })
);

module.exports = router;