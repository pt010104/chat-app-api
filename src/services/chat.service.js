'use strict'

const { NotFoundError } = require("../core/error.response")
const RoomRepository = require("../models/repository/room.repository")
const RabbitMQService = require("./rabbitmq.service")
const { BadRequestError } = require("../core/error.response")
const RedisService = require("./redis.service")
const ChatRepository = require("../models/repository/chat.repository")
const { findUserById } = require("../models/repository/user.repository")

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

    static createRoom = async (params) => {
        if (params.user_ids.length < 2) {
            throw new BadRequestError("Invalid Request")
        }

        //Chỉ có trường hợp one-to-one chat mới check exist room
        if(params.user_ids.length == 2) {
            const checkExistRoom = await RoomRepository.getRoomByUserIDs(params.user_ids)
            if(checkExistRoom) {
                throw new BadRequestError("Room already exist")
            }
        }

        //Tên group:
        //Trường hợp user_ids.length = 2 thì tên group là tên của user còn lại, avt group là avt của user còn lại
        if (params.user_ids.length == 2) {
            const friend_user_id = params.user_ids.filter(id => id !== params.userId)[0];

            const user = await findUserById(friend_user_id);
            params.name = user.name;
            params.avt_url = user.avatar;
        }

        //Trường hợp user_ids.length > 2 thì tên group là param name hoặc tên của tất cả user
        if (params.user_ids.length > 2) {
            if (!params.name) {
                params.name = '';
                for (let i = 0; i < params.user_ids.length; i++) {
                    const user = await findUserById(params.user_ids[i]);
                    params.name += user.name + ', ';
                }
            } 
            //Nếu không set avt thì avt nhóm mặc định là avt người tạo nhóm
            if (!params.avt_url) {
                const user = await findUserById(params.userId);
                params.avt_url = user.avatar;
            }
        }

        const newRoom = await RoomRepository.createRoom(params.name, params.avt_url, params.user_ids, params.userId);

        return newRoom
    }

    static async getNewMessagesEachRoom(userId) {
        let rooms = await RoomRepository.getRoomsByUserID(userId);
        const messages = [];
        const roomsTransformed = await RoomRepository.transformForClient(rooms);

        for (let i = 0; i < rooms.length; i++) {
            const key = 'newMessage:'+rooms[i]._id
            const message = await RedisService.get(key);
            if (message) {
                messages.push(JSON.parse(message))
            } else {
                messages.push(roomsTransformed[i])
            }
        }
        
        return {
            messages
        };
    }

    static async updateNewMessagesInRoom(roomId, message) {
        const key = 'newMessage:'+roomId;
        await RedisService.set(key, JSON.stringify(message));

        return;
    }

    static async getMessagesInRoom(room_id, page = 1, limit = 10) {
        const room = await RoomRepository.getRoomByID(room_id);

        if (!room) {
            throw new NotFoundError("Room not found")
        }

        const skip = (page - 1) * limit;

        const messages = await ChatRepository.getMessagesByRoomId(room_id, skip, limit);
        for (let i = 0; i < messages.length; i++) {
            messages[i] = await ChatRepository.transformForClient(messages[i]);
        }

        const totalMessages = await ChatRepository.countMessagesByRoomId(room_id);

        const totalPages = Math.ceil(totalMessages / limit)

        const amount = messages.length;

        return {
            "messages": messages,
            currentPage: parseInt(page),    
            totalPages,
            amount,
            totalMessages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    }
}

module.exports = ChatService