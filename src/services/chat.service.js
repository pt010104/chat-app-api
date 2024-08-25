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
        if (params.user_ids.length < 1) {
            throw new BadRequestError("Invalid Request")
        }

        // Nếu user_ids không chứa id của user hiện tại thì thêm vào 
        if (!params.user_ids.includes(params.userId)) {
            params.user_ids.push(params.userId);
        }

        //Chỉ có trường hợp one-to-one chat mới check exist room
        if(params.user_ids.length == 2) {
            const checkExistRoom = await RoomRepository.getRoomByUserIDs(params.user_ids)
            if(checkExistRoom) {
                return RoomRepository.transformForClient(checkExistRoom)
            }
        }

        //Tên group:
        //Trường hợp user_ids.length = 2 thì tên group là tên của user còn lại, room_avt không cần set, trong transform xử sau
        if (params.user_ids.length == 2) {
            const friend_user_id = params.user_ids.filter(id => id !== params.userId)[0];

            const user = await findUserById(friend_user_id);
            params.name = user.name
            params.auto_name = true
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
                params.auto_name = true;
            }
        }

        params.created_by = params.userId

        let newRoom = await RoomRepository.createRoom(params);

        newRoom = await RoomRepository.transformForClient(newRoom);

        return newRoom
    }

    static async detailRoom(room_id) {
        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found")
        }

        return RoomRepository.transformForClient(room)
    }

    static async getNewMessagesEachRoom(userId) {
        const rooms = await RoomRepository.getRoomsByUserID(userId);
        const roomsTransformed = await RoomRepository.transformForClient(rooms);
    
        const messagePromises = rooms.map(room => 
            RedisService.get('newMessage:' + room._id).then(async message => {
                if (message) {
                    const transformedData = await ChatRepository.transformForClient(JSON.parse(message));
                    return { message: transformedData };
                }
                return null;
            })
        );
                           
        const messageResults = await Promise.all(messagePromises);
    
        return roomsTransformed.map((room, index) => ({
            room,
            newMessage: messageResults[index]?.message
        }));
    }

    static async updateNewMessagesInRoom(roomId, message) {
        const key = 'newMessage:' + roomId;
        await RedisService.set(key, JSON.stringify(message));
    }

    static async getMessagesInRoom(room_id, page = 1, limit = 12) {
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
        let updatedRoom = await RoomRepository.addUsersToRoom(room_id, newUserIds);
    
        if (updatedRoom.user_ids.length > 2) {
            updatedRoom.is_group = true;
        }
    
        const userDetailsPromises = updatedRoom.user_ids.map(findUserById);
        const userDetails = await Promise.all(userDetailsPromises);
    
        if (updatedRoom.is_group && updatedRoom.auto_name) {
            const usersName = userDetails.map(user => user.name);
            updatedRoom.name = usersName.join(', ');
        }
    
        updatedRoom = await RoomRepository.updateRoom(updatedRoom);
    
        await RoomRepository.updateRedisCacheForRoom(updatedRoom);
    
        updatedRoom = await RoomRepository.transformForClient(updatedRoom);
    
        return updatedRoom;
    }

    static async updateRoom(params) {
        const room = await RoomRepository.getRoomByID(params.room_id);
        if (!room) {
            throw new NotFoundError("Room not found");
        }

        if (params.name) {
            room.name = params.name;
            room.auto_name = false;
        }

        if (params.avt_url && room.is_group) {
            room.avt_url = params.avt_url;
        }

        const updatedRoom = await RoomRepository.updateRoom(room);
        await RoomRepository.updateRedisCacheForRoom(updatedRoom);

        return RoomRepository.transformForClient(updatedRoom);
    }
}

module.exports = ChatService