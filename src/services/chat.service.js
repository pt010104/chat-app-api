'use strict'

const { NotFoundError } = require("../core/error.response")
const RoomRepository = require("../models/repository/room.repository")
const RabbitMQService = require("./rabbitmq.service")
const { BadRequestError } = require("../core/error.response")
const RedisService = require("./redis.service")

class ChatService {
    static sendMessage = async (user_id, room_id, message) => {
        
        const checkRoom = await RoomRepository.getRoomByID(room_id)
        if (!checkRoom) {
            throw new NotFoundError("Room not found")
        }

        const chatMessage = {
            user_id,
            message,
            room_id,
        }

        const queueName = String(room_id);

        await RabbitMQService.sendMessage(queueName, chatMessage);

        return chatMessage 
    }

    static createRoom = async (name, avt_url, user_ids) => {
        if (user_ids.length < 2) {
            throw new BadRequestError("Invalid Request")
        }

        //Chỉ có trường hợp one-to-one chat mới check exist room
        if(user_ids.length == 2) {
            const checkExistRoom = await RoomRepository.getRoomByUserIDs(user_ids)
            if(checkExistRoom) {
                throw new BadRequestError("Room already exist")
            }
        }

        const newRoom = await RoomRepository.createRoom(name, avt_url, user_ids);

        return newRoom
    }

    static async getUnreadMessages(user_id) {
        return await RedisService.getUnreadMessages(user_id);
    }
}

module.exports = ChatService