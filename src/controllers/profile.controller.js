"use strict";
const { OK, CREATED, SuccessResponse } = require("../core/success.response");
const { NotFoundError, ForbiddenError } = require("../core/error.response");
const User = require("../models/user.model");
const ProfileService = require("../services/profile.service");
class ProfileController {
    infoProfile = async (req, res, next) => {
        const id = req.body.id;
        new SuccessResponse({
            message: "Get user profile successfully",
            metadata: await ProfileService.infoProfile(id),
        }).send(res);

    }
}
module.exports = new ProfileController();
