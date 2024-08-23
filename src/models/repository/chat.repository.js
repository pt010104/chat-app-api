'use strict';

const ChatModel = require('../chat.model');
const RoomRepository = require('./room.repository');
const { BadRequestError } = require('../../core/error.response');
const { findUserById } = require('./user.repository');
const RedisService = require('../../services/redis.service');
const { chat } = require('googleapis/build/src/apis/chat');

class ChatRepository {
    transform(chatData) {
        return {
            user_id: chatData.user_id.toString(), 
            message: chatData.message,
            updated_at: chatData.updatedAt,
            created_at: chatData.createdAt,
            status: chatData.status,
            room_id: chatData.room_id.toString()
        };
    }

    transformForClient = async(chatData) => {
        const user = await findUserById(chatData.user_id);
        const user_name = user.name;
        const user_avatar = user.avatar;
        const user_avatar_thumb = user.thumb_avatar;

        const transformedData = {
            user_id: chatData.user_id.toString(),
            message: chatData.message,
            updated_at: chatData.updatedAt,
            created_at: chatData.createdAt,
            status: chatData.status,
        };

        if (user_name) {
            transformedData.user_name = user_name;
        }
        if (user_avatar) {
            transformedData.user_avatar = user_avatar;
        }
        if (user_avatar_thumb) {
            transformedData.user_avatar_thumb = user_avatar_thumb;
        }
        
        return transformedData
    }

    getMessageById = async (id) => {
        const message = await ChatModel.findById(id);
        return message;
    }

    saveMessage = async (user_id, room_id, message, created_at, updated_at) => {
        const key = `room:messages`;
        try {
            const newMessage = new ChatModel({
                user_id,
                room_id,
                message,
                createdAt: created_at,
                updatedAt: updated_at
            });
    
            const [, savedMessage] = await Promise.all([
                RedisService.storeOrUpdateMessage(key, room_id, newMessage),
                newMessage.save()
            ]);
    
            return savedMessage;
        } catch (error) {
            throw new BadRequestError(error);
        }
    }

    getMessagesByRoomId = async (room_id, skip = 0, limit = 10) => {
        const key = `room:messages`; 
        let messages = await RedisService.getMessages(key, room_id);
    
        if (messages.length > 0) {
            messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 
            const paginatedMessages = messages.slice(skip, skip + limit);
            return paginatedMessages;
        }
    
        messages = await ChatModel.find({ room_id }).sort({ createdAt: -1 }).lean();
    
        await Promise.all(messages.map(message =>
            RedisService.storeOrUpdateMessage(key, room_id, message)
        ));
    
        const paginatedMessages = messages.slice(skip, skip + limit);
        return paginatedMessages;
    }
    
    countMessagesByRoomId = async (room_id) => {
        return ChatModel.countDocuments({ room_id });
    }
    
}

module.exports = new ChatRepository();
