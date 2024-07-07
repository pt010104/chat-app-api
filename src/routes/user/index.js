"use strict";

const express = require("express");
const router = express.Router();
const UserController = require("../../controllers/user.controller");
const { asyncHandler } = require("../../helpers/asyncHandler");

router.post("/send-otp", asyncHandler(UserController.sendOTP));
router.post("/check-otp", asyncHandler(UserController.checkOTP));

module.exports = router;
