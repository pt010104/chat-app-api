"use strict";
const { OK, CREATED, SuccessResponse } = require("../core/success.response");
const { NotFoundError, ForbiddenError } = require("../core/error.response");
const User = require("../models/user.model");
const Joi = require("joi");
const ProfileService = require("../services/profile.service");
class ProfileController {
    infoProfile = async (req, res, next) => {
        const id = req.params.id;
        new SuccessResponse({
            message: "Get user profile successfully",
            metadata: await ProfileService.infoProfile(id),
        }).send(res);

    }

    updateInfo = async (req,res,next) => {
        const id = req.user.userId;
        const updateInfo = req.body;

        const infoValidate = Joi.object({
            name: Joi.string().alphanum().min(3).max(30).optional(),
            phone: Joi.string().min(10).max(20).optional(),
            gender: Joi.string().optional(),
            roles: Joi.array().items(Joi.string()),
            address: Joi.string().optional(),
        });
      
        const { error } = infoValidate.validate(updateInfo);
      
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        new SuccessResponse({
            message: "Update information successfully",
            metadata: await ProfileService.updateInfo(id,updateInfo),
        }).send(res);
    }
}
module.exports = new ProfileController();
