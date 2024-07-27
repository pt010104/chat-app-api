"use strict";
const { OK, CREATED, SuccessResponse } = require("../core/success.response");
const { NotFoundError, ForbiddenError } = require("../core/error.response");
const User = require("../models/user.model");
const UploadService = require("../services/upload.service");

class UploadController {

    uploadFile = async (req, res, next) => {

        new SuccessResponse({
            message: "Upload file successfully",
            metadata: await UploadService.uploadImage(),
        }).send(res);

    }

    uploadFileAvatar = async (req, res, next) => {
        const { file } = req;
        if (!file) {
            throw new NotFoundError("File not found");
        }
    
        new SuccessResponse({
            message: "Upload file successfully",
            metadata: await UploadService.uploadImageFromBuffer({
                buffer: file.buffer,
                user_id: req.user.userId,
                type: "avatar",
            }),
        }).send(res);
    }
    
}
module.exports = new UploadController();
