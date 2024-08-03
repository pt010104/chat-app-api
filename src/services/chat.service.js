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
        const chatMessage = {
            user_id,
            message,
            room_id,
        }

        await RabbitMQService.sendMessage(room_id, chatMessage);

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
                const userNames = [];
                for (let i = 0; i < params.user_ids.length; i++) {
                    const user = await findUserById(params.user_ids[i]);
                    userNames.push(user.name);
                }
                params.name = userNames.join(', ');
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
        const rooms = await RoomRepository.getRoomsByUserID(userId);
    
        const roomsTransformedPromise = RoomRepository.transformForClient(rooms);
    
        const messagePromises = rooms.map(room => {
            const key = 'newMessage:' + room._id;
            return RedisService.get(key);
        });
    
        const [roomsTransformed, ...messageResults] = await Promise.all([
            roomsTransformedPromise,
            ...messagePromises
        ]);
    
        const messages = messageResults.map((message, index) => {
            if (message) {
                return {
                    room: roomsTransformed[index],
                    newMessage: JSON.parse(message)
                };
            } else {
                return {
                    room: roomsTransformed[index],
                }
            }
        });
    
        return { messages };
    }

    static async updateNewMessagesInRoom(roomId, message) {
        const key = 'newMessage:' + roomId;
        await RedisService.set(key, JSON.stringify(message));
    }

    static async getMessagesInRoom(room_id, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
    
        const [room, messages, totalMessages] = await Promise.all([
            RoomRepository.getRoomByID(room_id),
            ChatRepository.getMessagesByRoomId(room_id, skip, limit),
            ChatRepository.countMessagesByRoomId(room_id)
        ]);
    
        if (!room) {
            throw new NotFoundError("Room not found");
        }
    
        const transformedMessages = await Promise.all(
            messages.map(message => ChatRepository.transformForClient(message))
        );
    
        const totalPages = Math.ceil(totalMessages / limit);
    
        return {
            messages: transformedMessages,
            currentPage: parseInt(page),    
            totalPages,
            amount: transformedMessages.length,
            totalMessages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        };
    }

    static async addUsersToRoom(room_id, newUserIds, userId) {
        let room = await RoomRepository.addUsersToRoom(room_id, newUserIds, userId);
        room = await RoomRepository.transformForClient(room);

        return room;
    }
}

module.exports = ChatService