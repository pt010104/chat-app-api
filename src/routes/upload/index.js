"use strict";

const express = require("express");
const router = express.Router();
const UploadController = require("../../controllers/upload.controller");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { authentication } = require("../../auth/authUtils");
const uploadDisk = require("../../dbs/init.multer");

//Upload
router.use(authentication);
router.post("/image/avatar", uploadDisk.single('file'), asyncHandler(UploadController.uploadFileAvatar));

module.exports = router;
