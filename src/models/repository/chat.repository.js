'use strict';

const ChatModel = require('../chat.model');
const RoomRepository = require('./room.repository');
const { BadRequestError } = require('../../core/error.response');
const { findUserById } = require('./user.repository');

class ChatRepository {
    transform(chatData) {
        return {
            user_id: chatData.user_id.toString(), 
            message: chatData.message,
            updated_at: this.formatDate(chatData.updatedAt),
            created_at: this.formatDate(chatData.createdAt),
            status: chatData.status,
            room_id: chatData.room_id.toString()
        };
    }

    transformForClient = async(chatData) => {
        const user = await findUserById(chatData.user_id);
        const user_name = user.name;
        const user_avatar = user.avatar;
        const user_avatar_thumb = user.thumb_avatar;

        const room = await RoomRepository.getRoomByID(chatData.room_id, chatData.user_id);
        const room_avatar = room.avt_url;
        const room_name = room.name;
        const room_user_ids = room.user_ids
        
        const transformedData = {
            user_id: chatData.user_id.toString(),
            message: chatData.message,
            updated_at: this.formatDate(chatData.updatedAt),
            created_at: this.formatDate(chatData.createdAt),
            status: chatData.status,
            room_id: chatData.room_id.toString(),
            is_group: room.is_group
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
        if (room_avatar) {
            transformedData.room_avatar = room_avatar;
        }
        if (room_name) {
            transformedData.room_name = room_name;
        }
        if (room_user_ids) {
            transformedData.room_user_ids = room_user_ids
        }
        
        return transformedData
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    getMessageById = async (id) => {
        const message = await ChatModel.findById(id);
        return message;
    }

    saveMessage = async (user_id, room_id, message) => {
        try {
            const newMessage = new ChatModel({
                user_id,
                room_id,
                message
            });
            return await newMessage.save();
        } catch (error) {
            throw new BadRequestError(error);
        }
    }

    getMessagesByRoomId = async (room_id, skip, limit) => {
        return ChatModel.find({ room_id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    }

    countMessagesByRoomId = async (room_id) => {
        return ChatModel.countDocuments({ room_id });
    }
}

module.exports = new ChatRepository();
