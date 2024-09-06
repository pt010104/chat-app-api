'use strict'

const { CREATED, SuccessResponse } = require("../core/success.response")
const privateRoomService = require("../services/privateRoom.service")   
const { OK } = require("../core/success.response")
const Joi = require("joi");

class roomE2EEController {
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
            metadata: await privateRoomService.createRoom(params)
        }).send(res)
    }

    detailRoom = async (req, res, next) => {
        const RoomValidat = Joi.object({
            room_id: Joi.string().required()
        })

        const { error } = RoomValidat.validate(req.params);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        let { room_id } = req.params;
        const userId = req.user.userId;

        new SuccessResponse({
            message: "Room detail retrieved successfully",
            metadata: await privateRoomService.detailRoom(room_id, userId)
        }).send(res)
    }

    getMessagesInRoom = async (req, res, next) => {
        const room_id = req.params.room_id;
        const page = req.query.page;
        const limit = req.query.limit;

        new SuccessResponse({
            message: "Messages retrieved successfully",
            metadata: await privateRoomService.getMessagesInRoom(room_id, page, limit)
        }).send(res)
    }

    getNewMessagesEachRoom = async (req, res, next) => {
        const userId = req.user.userId;

        new SuccessResponse({
            message: "New messages retrieved successfully",
            metadata: await privateRoomService.getNewMessagesEachRoom(userId)
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
            metadata: await privateRoomService.addUsersToRoom(room_id, user_ids, userId)
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
            metadata: await privateRoomService.updateRoom(params)
        }).send(res)
    }
    
    getAndSetKey = async (req, res, next) => {
        const room_id = req.body.room_id;
        const userId= req.user.userId;
        const getAndSetKeysValidate = Joi.object({
            room_id: Joi.string().required(),
        });

        const { error } = getAndSetKeysValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        new SuccessResponse({
            message: "Get and set keys successfully",
            metadata: await privateRoomService.getAndSetKey(room_id, userId)
        }).send(res)
    }

    endSession = async (req, res, next) => {
        const room_id = req.params.room_id;

        const endE2EEValidate = Joi.object({
            room_id: Joi.string().required(),
        });

        const { error } = endE2EEValidate.validate(req.params);

        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }
        const userId = req.user.userId;

        new SuccessResponse({
            message: "E2EE end successfully",
            metadata: await privateRoomService.endSession(room_id, userId)
        }).send(res)
    }


}

module.exports = new roomE2EEController()