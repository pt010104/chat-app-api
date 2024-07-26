'use strict';

const ChatModel = require('../chat.model');
const { BadRequestError } = require('../../core/error.response');

class ChatRepository {
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
