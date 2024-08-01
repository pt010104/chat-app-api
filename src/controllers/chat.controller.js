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

    addUsersToRoom = async (req, res, next) => {
        const room_id = req.params.room_id;
        const user_ids = req.body.user_ids;

        const addUsersToRoomValidate = Joi.object({
            user_ids: Joi.array().required(),
        });

        const { error } = addUsersToRoomValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        const userId = req.user.userId;

        new OK ({
            message: "Users added to room successfully",
            metadata: await ChatService.addUsersToRoom(room_id, user_ids, userId)
        }).send(res)
    }
    
    removeUserFromRoom = async (req, res, next) => {
        const room_id = req.params.room_id;
        const user_id = req.params.user_id;

        const userId = req.user.userId;

        new OK ({
            message: "User removed from room successfully",
            metadata: await ChatService.removeUsersFromRoom(room_id, user_id, userId)
        }).send(res)
    }   

    leaveRoom = async (req, res, next) => {
        const room_id = req.params.room_id;

        const userId = req.user.userId;

        new OK ({
            message: "User left room successfully",
            metadata: await ChatService.leaveRoom(room_id, userId)
        }).send(res)
    }

}

module.exports = new ChatController()