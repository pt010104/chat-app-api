"use strict";

const express = require("express");
const router = express.Router();
const UserController = require("../../controllers/user.controller");
const { asyncHandler } = require("../../helpers/asyncHandler");

//New uSer
router.post("/new-user", asyncHandler(UserController.newUser));


module.exports = router;
