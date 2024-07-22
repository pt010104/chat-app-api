"use strict";

const express = require("express");
const router = express.Router();
const ProfileController = require("../../controllers/profile.controller");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { authentication } = require("../../auth/authUtils");


router.use(authentication);
//get user profile
router.get("/info/:id", asyncHandler(ProfileController.infoProfile));

// update information
router.patch("/updateInfo",asyncHandler(ProfileController.updateInfo));

module.exports = router;
