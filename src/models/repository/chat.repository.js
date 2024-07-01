'use strict';

const chatModel = require('../chat.model');
const { BadRequestError } = require('../../core/error.response');

class ChatRepository {
    saveMessage = async (user_id, room_id, message) => {
        try {
            const newMessage = new chatModel({
                user_id,
                room_id,
                message
            });
            return await newMessage.save();
        } catch (error) {
            throw new BadRequestError(error);
        }
    }
}

module.exports = new ChatRepository();
