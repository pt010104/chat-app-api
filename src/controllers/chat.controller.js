'use strict'

const { CREATED } = require("../core/success.response")
const ChatService = require("../services/chat.service")
const { OK } = require("../core/success.response")
const Joi = require("joi");

class ChatController {
    createRoom = async (req, res, next) => {
        const roomValidate = Joi.object({
            name: Joi.string(),
            avt_url: Joi.string(),
            user_ids: Joi.array().required()
        });
        const { error } = roomValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        let params = req.body;
        params.userId = req.user.userId;
        
        new CREATED ({
            message: "Message sent successfully",
            metadata: await ChatService.createRoom(params)
        }).send(res)
    }

    getMessagesInRoom = async (req, res, next) => {
        const room_id = req.params.room_id;
        const page = req.query.page;
        const limit = req.query.limit;

        new OK ({
            message: "Messages retrieved successfully",
            metadata: await ChatService.getMessagesInRoom(room_id, page, limit)
        }).send(res)
    }

    getNewMessagesEachRoom = async (req, res, next) => {
        const userId = req.user.userId;

        new OK ({
            message: "New messages retrieved successfully",
            metadata: await ChatService.getNewMessagesEachRoom(userId)
        }).send(res)
    }
}

module.exports = new ChatController()