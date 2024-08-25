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
        console.log(chatData)
        const user = await findUserById(chatData.user_id);
        const user_name = user.name;
        const user_avatar = user.avatar;
        const user_avatar_thumb = user.thumb_avatar;

        console.log(chatData)
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
        const key = `room:message`;
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
        const key = `room:message`
        let messages = await RedisService.getMessages(key, room_id, limit, skip);
    
        if (messages.length > 0) {
            return messages;
        }
    
        messages = await ChatModel.find({ room_id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    
        messages.forEach(async (message) => {
            await RedisService.storeOrUpdateMessage(key, room_id, message);
        });
    
        return messages;
    }

    countMessagesByRoomId = async (room_id) => {
        return ChatModel.countDocuments({ room_id });
    }

    deleteMessage = async (message_id) => {
        await RedisService.delete(`room:message:${message_id}`);
        return ChatModel.findByIdAndDelete(message_id);
    }
    
    editMessage = async (message_id, content, userID) => {
        const key = `room:message:${message_id}`;
        
        // Fetch the message from Redis
        const message = await RedisService.get(key);
        
        if (!message) {
            throw new Error("Message not found");
        }
    
        const parsedMessage = JSON.parse(message);
    
        // Check if the user is allowed to edit the message
        if (parsedMessage.user_id.toString() !== userID.toString()) {
            throw new BadRequestError("You are not allowed to edit this message");
        }
    
        // Update the message content and timestamp
        parsedMessage.message = content;
        parsedMessage.updatedAt = new Date();
    
        // Save the updated message back to Redis
        await RedisService.set(key, JSON.stringify(parsedMessage));
    
        // Update the message in the database
        return ChatModel.findByIdAndUpdate(message_id, { message: content }, { new: true });
    }
    
}

module.exports = new ChatRepository();
