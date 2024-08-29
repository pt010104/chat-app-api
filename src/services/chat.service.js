'use strict'

const { NotFoundError } = require("../core/error.response")
const RoomRepository = require("../models/repository/room.repository")
const RabbitMQService = require("./rabbitmq.service")
const { BadRequestError } = require("../core/error.response")
const RedisService = require("./redis.service")
const ChatRepository = require("../models/repository/chat.repository")
const { findUserById } = require("../models/repository/user.repository")
const pinMessageRepository = require("../models/repository/pinMessage.repository")
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
        if (params.user_ids.length == 2) {
            const checkExistRoom = await RoomRepository.getRoomByUserIDs(params.user_ids)
            if (checkExistRoom) {
                return RoomRepository.transformForClient(checkExistRoom, params.userId)
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

        newRoom = await RoomRepository.transformForClient(newRoom, params.userId);

        return newRoom
    }

    static async detailRoom(room_id, userId) {
        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found")
        }

        return RoomRepository.transformForDetailRoom(room, userId)
    }

    static async getNewMessagesEachRoom(userId) {
        const rooms = await RoomRepository.getRoomsByUserID(userId);
        const roomsTransformed = await RoomRepository.transformForClient(rooms, userId);

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

        updatedRoom = await RoomRepository.transformForClient(updatedRoom, userId);

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

        return RoomRepository.transformForClient(updatedRoom, params);
    }

    static async deleteMessagesInRoom(userId, room_id, message_ids) {
        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found");
        }

        const messages = await ChatRepository.getMessagesByIds(message_ids);

        if (messages.user_id !== userId) {
            throw new BadRequestError("You are not the author of this message");
        }

        const deletedMessage=await ChatRepository.deleteMessagesInRoom(message_ids);
        await ChatRepository.updateRedisCache(room_id);
        return ChatRepository.transformForClient(deletedMessage);
    }

    static async editMessageInRoom(user_id, room_id, message_id, message) {
        console.log(user_id, room_id, message_id, message)
        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found");
        }

        const infoMessage = await ChatRepository.getMessageById(message_id);
        if (!infoMessage) {
            throw new NotFoundError("Message not found");
        }

        if (infoMessage.user_id.toString() !== user_id.toString()) {
            throw new BadRequestError("You are not the author of this message");
        }

        const chatMessage = {
            user_id,
            message,
            room_id,
        }

        const updatedMessage = await ChatRepository.editMessageInRoom(chatMessage, message_id);
        await ChatRepository.updateRedisCache(room_id);
        return ChatRepository.transformForClient(updatedMessage);
    }

    static async pinMessageInRoom(room_id, message_id) {

        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found");
        }

        const infoMessage = await ChatRepository.getMessageById(message_id);
        if (!infoMessage) {
            throw new NotFoundError("Message not found");
        }

        const updatedMessage = await pinMessageRepository.pinMessage(room_id, message_id);

        return ChatRepository.transformForClient(updatedMessage);
    }

    static async unpinMessageInRoom(room_id, message_id) {
        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found");
        }

        const infoMessage = await ChatRepository.getMessageById(message_id);
        if (!infoMessage) {
            throw new NotFoundError("Message not found");
        }

        const updatedMessage = await pinMessageRepository.unpinMessage(room_id, message_id);

        return ChatRepository.transformForClient(updatedMessage);
    }

    static async listPinnedMessages(room_id) {
        const key = 'pinMessage:' + room_id;
        let message_ids = await RedisService.lRange(key, 0, -1);
        if (!message_ids) {
            return [];
        }
        let listNotExists;
        message_ids = await Promise.all(message_ids.map(async message_id => {
            const message = await ChatRepository.getMessageById(message_id);
            if (!message) {
                listNotExists.push(message_id);
            }
            return ChatRepository.transformForClient(message);
        }));
        if (listNotExists)
            for (const message_id of listNotExists)
                pinMessageRepository.unpinMessage(room_id, message_id);

        return message_ids;
    }
    
}

module.exports = ChatService