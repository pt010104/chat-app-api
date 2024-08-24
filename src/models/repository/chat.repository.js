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
        const key = `room:messages:${room_id}:${skip}:${limit}`;
    
        let cachedMessages = await RedisService.get(key);
    
        if (cachedMessages) {
            return JSON.parse(cachedMessages);
        }
    
        const messages = await ChatModel.find({ room_id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        if (messages.length > 0) {
            await RedisService.set(key, JSON.stringify(messages)); 
            console.log(`Cached ${messages.length} messages for room ${room_id} with key ${key}`);
        }
    
        return messages;
    }
    
    countMessagesByRoomId = async (room_id) => {
        return ChatModel.countDocuments({ room_id });
    }
    
}

module.exports = new ChatRepository();
