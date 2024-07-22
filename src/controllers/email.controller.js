'use strict';

const { SuccessResponse } = require("../core/success.response");
const { newTemplate } = require("../services/template.service");
const Joi = require("joi");

class EmailController {
    newTemplate = async (req, res, next) => {
        const templateValidate = Joi.object({
            type: Joi.string().required(),
            tem_id: Joi.string().required(),
            name: Joi.string().required(),
        });

        const { error } = templateValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message,
            });
        }

        const { type, tem_id, name } = req.body;
        new SuccessResponse({
            message: "Template created successfully",
            metadata: await newTemplate(tem_id, name, type)
        }).send(res);
    }
}

module.exports = new EmailController();
