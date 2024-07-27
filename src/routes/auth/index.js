"use strict";

const express = require("express");
const router = express.Router();
const AuthController = require("../../controllers/auth.controller");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { authentication } = require("../../auth/authUtils");

//register
router.post("/signup", asyncHandler(AuthController.signUp));
router.post("/signin", asyncHandler(AuthController.signIn));

router.use(authentication);

router.post("/change-password", asyncHandler(AuthController.changePassword))
router.post("/forget-password", asyncHandler(AuthController.forgetPassword));

module.exports = router;
