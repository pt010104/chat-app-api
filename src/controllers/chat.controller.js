'use strict'

const { SuccessResponse } = require("../core/success.response")
const ChatService = require("../services/chat.service")
const Joi = require("joi");

class ChatController {
    sendMessage = async (req, res, next) => {

        const messageValidate = Joi.object({
            room_id: Joi.string().required(),
            message: Joi.string().required()
        });
        const { error } = messageValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        const { room_id, message } = req.body;
        const user_id = req.user.userId

        new SuccessResponse ({
            message: "Message sent successfully",
            metadata: await ChatService.sendMessage(user_id, room_id, message)
        }).send(res)
    }

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