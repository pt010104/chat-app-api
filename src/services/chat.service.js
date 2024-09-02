'use strict'

const { NotFoundError } = require("../core/error.response")
const RoomRepository = require("../models/repository/room.repository")
const RabbitMQService = require("./rabbitmq.service")
const { BadRequestError } = require("../core/error.response")
const RedisService = require("./redis.service")
const ChatRepository = require("../models/repository/chat.repository")
const { findUserById } = require("../models/repository/user.repository")
const { removeVietNamese } = require("../utils")
const QueueNames = require("../utils/queueNames")

class ChatService {
    static async sendMessage(params) {
        const chatMessage = {
            user_id: params.user_id,
            message: params.message,
            room_id: params.room_id,
        };
    
        if (params.buffer) {
            chatMessage.buffer = params.buffer;
            await RabbitMQService.sendMedia(QueueNames.IMAGE_MESSAGES, chatMessage);
        } else if (params.isGift) {
            const release_time = params.releaseTime;
            const now = new Date();
            const releaseTime = new Date(release_time);
            console.log(now)
            const delay = releaseTime - now;
            if (delay < 0) {
                console.warn('Release time is in the past. Sending message immediately.');
                chatMessage.is_gift = false;
                await RabbitMQService.sendMessage(QueueNames.CHAT_MESSAGES, chatMessage);
            } else {
                console.log(delay)
                chatMessage.is_gift = true;
                chatMessage.release_time = release_time;
                const saveMessage = await ChatRepository.saveMessage(chatMessage);
                
                setTimeout(async () => {
                    await ChatRepository.updateMessageGiftStatus(saveMessage._id, false);
                    ChatRepository.updateRedisCache(saveMessage.room_id);
                    console.info(`Message ID ${saveMessage._id}: is_gift status updated to false`);
                }, delay || 100); 
            }
        } else {
            await RabbitMQService.sendMessage(QueueNames.CHAT_MESSAGES, chatMessage);
        }
    
        return chatMessage;
    }
    

    static createRoom = async (params) => {
        if (params.user_ids.length < 1) {
            throw new BadRequestError("Invalid Request")
        }

        const matchingUserIds = params.user_ids.filter(id => id === params.userId);
        if (matchingUserIds.length >= 2) {
            throw new BadRequestError("Invalid Request")
        } else if (params.user_ids.length == 1 && matchingUserIds.length != 0) {
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
                return RoomRepository.transformForClient(checkExistRoom, params.userId)
            }
        }

        //Tên group:
        //Trường hợp user_ids.length = 2 thì tên group là tên của user còn lại, room_avt không cần set, trong transform xử sau
        if (params.user_ids.length == 2) {
            const friend_user_id = params.user_ids.filter(id => id !== params.userId)[0];
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
        params.name_remove_sign = removeVietNamese(params.name);

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
        if (message.image_url) {
            message.message = 'Sent an image';
            delete message.buffer;
            RedisService.set(key, JSON.stringify(message));
        } else {
            console.log(key)
            RedisService.set(key, JSON.stringify(message));  
        }
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
            room.name_remove_sign = removeVietNamese(params.name);
            room.auto_name = false;
        }

        if (params.avt_url && room.is_group) {
            room.avt_url = params.avt_url;
        }

        console.log(room)

        const updatedRoom = await RoomRepository.updateRoom(room);
        RoomRepository.updateRedisCacheForRoom(updatedRoom);

        return RoomRepository.transformForClient(updatedRoom, params);
    }

    static async searchRoom(userId, filter) {
        const rooms = await RoomRepository.getRoomsByUserID(userId);

        console.log(rooms)

        filter = removeVietNamese(filter);
        const regex = new RegExp(filter, 'i');
        
        const filteredRooms = rooms.filter(room => {
            const roomName = room.name_remove_sign;
            return regex.test(roomName);
        });

        const transformedRooms = await Promise.all(filteredRooms.map(room => RoomRepository.transformForClient(room, userId)));

        return transformedRooms;
    }
}

module.exports = ChatService