'use strict'

const { SuccessResponse } = require("../core/success.response")
const ChatService = require("../services/chat.service")
const Joi = require("joi");

class ChatController {
    createRoom = async (req, res, next) => {
        const roomValidate = Joi.object({
            name: Joi.string().required(),
            avt_link: Joi.string().required(),
            users: Joi.array().required()
        });
        const { error } = roomValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        const { name, avt_link, users } = req.body;
        const user_id = req.user.userId

        new SuccessResponse ({
            message: "Message sent successfully",
            metadata: await ChatService.createRoom(name, avt_link, users)
        }).send(res)
    }
}

module.exports = new ChatController()