"use strict";

const express = require("express");
const router = express.Router();
const EmailController = require("../../controllers/email.controller");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { authentication } = require("../../auth/authUtils");

//register

router.post("/new-template", asyncHandler(EmailController.newTemplate));

module.exports = router;
