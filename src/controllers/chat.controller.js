'use strict'

const { CREATED } = require("../core/success.response")
const ChatService = require("../services/chat.service")
const Joi = require("joi");

class ChatController {
    createRoom = async (req, res, next) => {
        const roomValidate = Joi.object({
            name: Joi.string().required(),
            avt_url: Joi.string().required(),
            user_ids: Joi.array().required()
        });
        const { error } = roomValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        const { name, avt_url, user_ids } = req.body;
        
        new CREATED ({
            message: "Message sent successfully",
            metadata: await ChatService.createRoom(name, avt_url, user_ids)
        }).send(res)
    }
}

module.exports = new ChatController()