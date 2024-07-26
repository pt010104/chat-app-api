'use strict'

const { NotFoundError } = require("../core/error.response")
const RoomRepository = require("../models/repository/room.repository")
const RabbitMQService = require("./rabbitmq.service")
const { BadRequestError } = require("../core/error.response")
const RedisService = require("./redis.service")
const chatRepository = require("../models/repository/chat.repository")

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
        const type = 'unread';
        const message = await RedisService.getAndClearMessages(type, user_id);
        
        return message
    }

    static async getNewMessagesEachRoom(userId) {
        const rooms = await RoomRepository.getRoomByUserID(userId);
        const type = 'newMessage';
        const messages = [];
        for (let i = 0; i < rooms.length; i++) {
            const id = rooms[i]._id+':'+userId;
            const message = await RedisService.getAndClearMessages(type, id);
            if (message) {
                messages.push(message);
            }
        }
        
        return messages;
    }

    static async updateNewMessagesInRoom(room_id, user_id, message) {
        const type = 'newMessage'
        const id = room_id+':'+user_id;
        RedisService.storeMessage(type, id, message);

        return;
    }

    static async getMessagesInRoom(room_id, page = 1, limit = 10) {
        const room = await RoomRepository.getRoomByID(room_id);

        if (!room) {
            throw new NotFoundError("Room not found")
        }

        const skip = (page - 1) * limit;

        const messages = await chatRepository.getMessagesByRoomId(room_id, skip, limit);

        const totalMessages = await chatRepository.countMessagesByRoomId(room_id);

        const totalPages = Math.ceil(totalMessages / limit)

        return {
            messages,
            currentPage: page,
            totalPages,
            totalMessages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    }
}

module.exports = ChatService