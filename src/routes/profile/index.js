"use strict";

const express = require("express");
const router = express.Router();
const ProfileController = require("../../controllers/profile.controller");
const { asyncHandler } = require("../../helpers/asyncHandler");
//register
router.get("/info", asyncHandler(ProfileController.infoProfile));



module.exports = router;
