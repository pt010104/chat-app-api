"use strict";

const express = require("express");
const router = express.Router();
const UserController = require("../../controllers/user.controller");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { authentication } = require("../../auth/authUtils");

router.post("/send-otp", asyncHandler(UserController.sendOTP));
router.post("/check-otp", asyncHandler(UserController.checkOTP));

router.use(authentication);
router.post("/send-otp-change-password", asyncHandler(UserController.sendOTPChangePassword));
router.post("/search", asyncHandler(UserController.searchForUser));

module.exports = router;
