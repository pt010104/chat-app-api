"use strict";

const express = require("express");
const router = express.Router();
const UploadController = require("../../controllers/upload.controller");
const { asyncHandler } = require("../../helpers/asyncHandler");
const { authentication } = require("../../auth/authUtils");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

//Upload
router.use(authentication);
router.post("/image/avatar", upload.single('file'), asyncHandler(UploadController.uploadFileAvatar));

module.exports = router;
