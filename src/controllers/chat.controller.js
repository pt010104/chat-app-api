'use strict'

const { CREATED, SuccessResponse } = require("../core/success.response")
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

    detailRoom = async (req, res, next) => {
        const RoomValidate = Joi.object({
            room_id: Joi.string().required()
        })

        const { error } = RoomValidate.validate(req.params);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        let { room_id } = req.params;
        const userId = req.user.userId;

        new SuccessResponse({
            message: "Room detail retrieved successfully",
            metadata: await ChatService.detailRoom(room_id, userId)
        }).send(res)
    }

    getMessagesInRoom = async (req, res, next) => {
        const room_id = req.params.room_id;
        const page = req.query.page;
        const limit = req.query.limit;

        new SuccessResponse({
            message: "Messages retrieved successfully",
            metadata: await ChatService.getMessagesInRoom(room_id, page, limit)
        }).send(res)
    }

    getNewMessagesEachRoom = async (req, res, next) => {
        const userId = req.user.userId;

        new SuccessResponse({
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

        new SuccessResponse({
            message: "Users added to room successfully",
            metadata: await ChatService.addUsersToRoom(room_id, user_ids, userId)
        }).send(res)
    }

    updateRoom = async (req, res, next) => {
        const updateRoomValidate = Joi.object({
            name: Joi.string().optional(),
            avt_url: Joi.string().optional(),
        });
        const { error } = updateRoomValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        let params = req.body;
        params.userId = req.user.userId;
        params.room_id = req.params.room_id;

        new SuccessResponse({
            message: "Room updated successfully",
            metadata: await ChatService.updateRoom(params)
        }).send(res)
    }

    deleteMessagesInRoom = async (req, res, next) => {
        const room_id = req.params.room_id;
        const message_id = req.body.message_id;
        
        const deleteMessagesInRoomValidate = Joi.object({
            message_id: Joi.array().required()
        });

        const { error } = deleteMessagesInRoomValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }
        
        new SuccessResponse({
            message: "Messages deleted successfully",
            metadata: await ChatService.deleteMessagesInRoom(room_id, message_id)
        }).send(res)
    }

    editMessageInRoom = async (req, res, next) => {
        const room_id = req.params.room_id;
        const message_id = req.body.message_id;
        const content = req.body.content;

        const editMessageInRoomValidate = Joi.object({
            message_id: Joi.string().required(),
            content: Joi.string().required()
        });

        const { error } = editMessageInRoomValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        new SuccessResponse({
            message: "Message edited successfully",
            metadata: await ChatService.editMessageInRoom(room_id, message_id, content)
        }).send(res)
    }
}

module.exports = new ChatController()