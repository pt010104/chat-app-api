'use strict'

const { NotFoundError } = require("../core/error.response")
const ChatModel = require("../models/chat.model")
const ChatRepository = require("../models/repository/chat.repository")
const RoomRepository = require("../models/repository/room.repository")
const RabbitMQService = require("./rabbitmq.service")
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
            recipient_id: message.recipient_id
        }

        await RabbitMQService.sendMessage(room_id, chatMessage);

        return chatMessage 
    }

    static createRoom = async (name, avt_link, users) => {

        //Chỉ có trường hợp one-to-one chat mới check exist room
        if(users.length == 2) {
            const checkExistRoom = await RoomRepository.getRoomByUsers(users)
            if(checkExistRoom) {
                throw new BadRequestError("Room already exist")
            }
        }

        const newRoom = await RoomRepository.createRoom(name, avt_link, users);

        return newRoom
    }

    static async getUnreadMessages(user_id) {
        return await RedisService.getUnreadMessages(user_id);
    }
}

module.exports = ChatService