'use strict'

const { NotFoundError } = require("../core/error.response")
const RoomRepository = require("../models/repository/room.repository")
const RabbitMQService = require("./rabbitmq.service")
const { BadRequestError } = require("../core/error.response")
const RedisService = require("./redis.service")
const ChatRepository = require("../models/repository/chat.repository")
const { findUserById } = require("../models/repository/user.repository")
const { removeVietNamese } = require("../utils")
const pinMessageRepository = require("../models/repository/pinMessage.repository")
const QueueNames = require("../utils/queueNames")
const { v4: uuidv4 } = require('uuid');


class ChatService {
    static async sendMessage(params) {
        const chatMessage = {
            user_id: params.user_id,
            message: params.message,
            room_id: params.room_id,
        };

        if (params.is_gift) {
            const release_time = params.release_time;
            const now = new Date();
            const releaseTime = new Date(release_time);
            console.log(now)
            const delay = releaseTime - now;
            if (delay < 0) {
                console.warn('Release time is in the past. Sending message immediately.');
                chatMessage.is_gift = false;
                if (params.buffer) {
                    chatMessage.buffer = params.buffer;
                    await RabbitMQService.sendMedia(QueueNames.IMAGE_MESSAGES, chatMessage);
                } else {
                    await RabbitMQService.sendMessage(QueueNames.CHAT_MESSAGES, chatMessage);
                }
            } else {
                console.log(delay)
                chatMessage.is_gift = true;
                chatMessage.release_time = release_time;
                chatMessage.gift_id = uuidv4();

                if (params.buffer) {
                    chatMessage.buffer = params.buffer;
                    await RabbitMQService.sendMedia(QueueNames.IMAGE_MESSAGES, chatMessage);
                } else {
                    await RabbitMQService.sendMessage(QueueNames.CHAT_MESSAGES, chatMessage);
                }

                setTimeout(async () => {
                    chatMessage.is_gift = false;
                    const updatedMsg = await ChatRepository.updateMessageGiftStatus(chatMessage.gift_id, false)
                    const transformedMessage = await ChatRepository.transformForClient(updatedMsg, params.user_id);

                    const io = global._io;
                    io.to(chatMessage.room_id).emit("opened gift", { "data": transformedMessage });
                    console.log('Emitting opened gift to ', chatMessage.room_id, "\n data: ", transformedMessage);

                    ChatRepository.updateRedisCache(chatMessage.room_id);

                }, delay || 100);
            }
        } else if (params.buffer) {
            chatMessage.buffer = params.buffer;
            await RabbitMQService.sendMedia(QueueNames.IMAGE_MESSAGES, chatMessage);
        } else {
            await RabbitMQService.sendMessage(QueueNames.CHAT_MESSAGES, chatMessage);
        }

        return chatMessage;
    }

    static async updateLikeMessage(messageId, roomId, userId) {
        const message = await ChatRepository.getMessageById(messageId);
        if (!message) {
            throw new NotFoundError("Message not found");
        }

        if (message.room_id != roomId) {
            throw new BadRequestError("Invalid Request");
        }

        let type = 'like';

        console.log(message.liked_by)

        if (message.liked_by) {
            if (message.liked_by.toString().includes(userId)) {
                type = 'unlike';
                console.log('unlike')
            }
        }

        const updatedMessage = await ChatRepository.updateLikeMessage(messageId, roomId, userId, type);

        const transformedMessage = await ChatRepository.transformForClient(updatedMessage, userId);

        const io = global._io;
        io.to(roomId).emit("like message", { "data": transformedMessage });
    
        return transformedMessage;
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
        if (params.user_ids.length == 2) {
            const checkExistRoom = await RoomRepository.getRoomByUserIDs(params.user_ids)
            if (checkExistRoom) {
                return RoomRepository.transformForClient(checkExistRoom, params.userId)
            }
        }

        //Tên group:
        //Trường hợp user_ids.length = 2 thì tên group là tên của user còn lại, room_avt không cần set, trong transform xử sau
        if (params.user_ids.length == 2) {
            const userNames = [];
            for (let i = 0; i < params.user_ids.length; i++) {
                const user = await findUserById(params.user_ids[i]);
                userNames.push(user.name);
            }
            params.name = userNames.join(', ');
            params.auto_name = true;
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
                    const transformedData = await ChatRepository.transformForClient(JSON.parse(message), userId);
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
        } else if (message.is_gift) {
            message.message = 'Sent a gift';
            RedisService.set(key, JSON.stringify(message));
        } else {
            console.log(key)
            RedisService.set(key, JSON.stringify(message));
        }
    }

    static async getMessagesInRoom(room_id, page = 1, limit = 12, userId) {
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
            messages.map(message => ChatRepository.transformForClient(message, userId))
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
        const checkRoom = await RoomRepository.getRoomByID(room_id);

        if (checkRoom) {
            if (!checkRoom.is_group) {
                throw new BadRequestError("Can't add user to one-to-one chat");
            }
        } else {
            throw new NotFoundError("Room not found");
        }

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

    static async removeUsersFromRoom(room_id, user_ids, userId) {
        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new Error('Room not found');
        }
      
        const isUserInRoom = room.user_ids.includes(userId);
        if (!isUserInRoom) {
            throw new Error('User is not in the room remove');
        }

        if (room.is_group && room.created_by.toString() !== userId.toString()) {
            throw new Error('Only the creator of the group can remove users');
        }
        if (user_ids.includes(userId)) {
            throw new Error('You cannot remove yourself from the room');
        }
        if (!room.is_group) {
            throw new Error('Cannot remove users from a one-to-one chat');
        }
        try {
            let updatedRoom = await RoomRepository.removeUsersFromRoom(room_id, user_ids);

            const userDetailsPromises = updatedRoom.user_ids.map(findUserById);
            const userDetails = await Promise.all(userDetailsPromises);

            if (updatedRoom.is_group && updatedRoom.auto_name) {
                const usersName = userDetails.map(user => user.name);
                updatedRoom.name = usersName.join(', ');
            }
            
            updatedRoom = await RoomRepository.updateRoom(updatedRoom);

            await RoomRepository.updateRedisCacheForRoom(updatedRoom);
     
            await RoomRepository.deleteListRoomRemoveUser(room_id, user_ids);

            updatedRoom = await RoomRepository.transformForClient(updatedRoom);
            
            if (updatedRoom.room_user_ids.length === 1) {
                await this.leaveRoom(room_id, userId);
                return;
            }
            return updatedRoom;
        }
        catch (error) {
            throw new BadRequestError(error);
        }
    }

    static async leaveRoom(room_id, userId) {
        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new Error('Room not found');
        }
      
        const isUserInRoom = room.user_ids.includes(userId);
        if (!isUserInRoom) {
            throw new Error('User is not in the room leave');
        }      

        if (!room.is_group) {
            throw new Error('Cannot leave a one-to-one chat');
        }

        if (!room.user_ids.includes(userId)) {
            throw new BadRequestError("User is not in the room");
        }
        // update list room user remove user
        let updatedRoom = await RoomRepository.removeUsersFromRoom(room_id, [userId]); //DB       
        await RoomRepository.updateRedisCacheForRoom(updatedRoom);//user in room
        await RoomRepository.deleteListRoomRemoveUser(room, [userId]);//user leave
        if (room.user_ids.length === 0) {
            await RoomRepository.deleteRoomDb(room_id);            
            return;
        }


        return updatedRoom;
    }

    // static async listRooms(userId, page, limit) {
    //     const offset = (page - 1) * limit;
    //     const rooms = await RoomRepository.getListRoomsByUserID(userId, offset, limit);
    //     const roomsTransformed = await RoomRepository.transformForClient(rooms);
    //     return roomsTransformed;
    // }

    static async deleteRoom(room_id, userId) {
        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found");
        }

        if (room.created_by.toString() !== userId.toString()) {
            throw new BadRequestError("You are not the creator of the room");
        }

        if(!room.is_group){
            throw new BadRequestError("Cannot delete a one-to-one chat");
        }

        await RoomRepository.deleteRoomDb(room_id);
        
        for(const user_id of room.user_ids)
            await RoomRepository.deleteListRoomRemoveUser(room, [user_id]);
        return true;
    }

    static async deleteMessagesInRoom(userId, room_id, message_ids) {
        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found");
        }

        const deleteMessages = {
            user_id: userId,
            message_id: message_ids,
            room_id: room_id
        }
        RabbitMQService.deleteMessage(QueueNames.DELETE_MESSAGES, deleteMessages);
        return deleteMessages;
    }

    static async editMessageInRoom(user_id, room_id, message_id, message) {
        console.log(user_id, room_id, message_id, message)
        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found");
        }
        const editMessage = {
            user_id,
            message,
            room_id,
            message_id
        }
        await RabbitMQService.editMessage(QueueNames.EDIT_MESSAGES, editMessage);
        return message;
    }

    static async pinMessageInRoom(room_id,user_id, message_id) {

        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found");
        }

        const infoMessage = await ChatRepository.getMessageById(message_id);
        if (!infoMessage) {
            throw new NotFoundError("Message not found");
        }
        
        await pinMessageRepository.pinMessage(room_id, message_id);
        const filteredUserIDs = room.user_ids.filter(userId => userId.toString() !== user_id.toString());
        this.notifyAndBroadcastPinMessage(room_id,filteredUserIDs ,infoMessage);
        return ChatRepository.transformForClient(infoMessage,infoMessage.user_id);
    }

    static async unpinMessageInRoom(room_id,user_id ,message_id) {
        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found");
        }

        const infoMessage = await ChatRepository.getMessageById(message_id);
        if (!infoMessage) {
            throw new NotFoundError("Message not found");
        }

        await pinMessageRepository.unpinMessage(room_id, message_id);
        const filteredUserIDs = room.user_ids.filter(userId => userId.toString() !== user_id.toString());
        this.notifyAndBroadcastUnpinMessage(room_id, filteredUserIDs, infoMessage);
        return message_id;
    }
    
    static async listPinnedMessages(room_id) {
        const key = 'pinMessage:' + room_id;
        let message_ids = await RedisService.lRange(key, 0, -1);

        if (!message_ids || message_ids.length === 0) {
            message_ids = await pinMessageRepository.getListPinMessage(room_id);
        }
    
        if (message_ids.length === 0) {
            return []; // No messages to process
        }

         let listNotExists = []; // Correctly declare the array
        const listMessage = await Promise.all(message_ids.map(async message_id => {
            const message = await ChatRepository.getMessageById(message_id);
            if (!message) {
                listNotExists.push(message_id);
            }
            else{
                console.log(message.message)
                return ChatRepository.transformForClient(message, message.user_id);
            } 
        }));

        if (listNotExists>0)
          await Promise.all(listNotExists.map(async message_id => {
            await pinMessageRepository.unpinMessage(room_id, message_id);
          }));
        console.log(listMessage)
        return listMessage;
    }

    static async notifyAndBroadcastPinMessage(roomId, userIDs, message) {
        const io = global._io;
        io.to(roomId).emit("pinned message", { "data": message });
        const onlineUserPromises = userIDs.map(async (userId) => {
            const userStatus = await RedisService.getUserStatus(userId);
            if (userStatus === 'online') {
                io.to(`user_${userId}`).emit("pinned message", { "data": message });
            }
        });
        await Promise.all(onlineUserPromises);
    }

    static async notifyAndBroadcastUnpinMessage(roomId, userIDs, message) {
        const io = global._io;
        io.to(roomId).emit("unpinned message", { "data": message });
        const onlineUserPromises = userIDs.map(async (userId) => {
            const userStatus = await RedisService.getUserStatus(userId);
            if (userStatus === 'online') {
                io.to(`user_${userId}`).emit("unpinned message", { "data": message });
            }
        });
        await Promise.all(onlineUserPromises);
    }

    static async searchRoom(userId, filter) {
        const rooms = await RoomRepository.getRoomsByUserID(userId);

        const filterNoAccents = removeVietNamese(filter);
        const regex = new RegExp(filterNoAccents, 'i');

        const filteredRooms = await Promise.all(rooms.map(async (room) => {
            let roomName;
            if (room.is_group) {
                roomName = room.name;
            } else {
                const otherUserId = room.user_ids.find(id => id != userId);
                if (otherUserId && room.auto_name) {
                    const user = await findUserById(otherUserId);
                    roomName = user ? user.name : room.name;
                } else {
                    roomName = room.name;
                }
            }

            const roomNameNoAccents = removeVietNamese(roomName);
            return regex.test(roomNameNoAccents) ? room : null;
        }));

        const result = filteredRooms.filter(room => room !== null);

        return await RoomRepository.transformForClient(result, userId);
    }
}

module.exports = ChatService;
