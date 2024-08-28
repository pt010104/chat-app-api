'use strict';


const { BadRequestError } = require('../../core/error.response');
const { findUserById } = require('./user.repository');
const RedisService = require('../../services/redis.service');
const { NotFoundError } = require('../../core/error.response');
const pinMessageModel = require('../pinMessage.model');



class pinMessageRepository {
    async pinMessage(room_id, message_id) {
        const message = await pinMessageModel.findByIdAndUpdate(
            room_id,
            { $addToSet: { message_id } },
            { new: true, runValidators: true }
        );
        if (!message) {
            throw new NotFoundError('Room not found');
        }
        const key= 'pinMessage:' + room_id;
        await RedisService.rPush(key, message_id);
        return message;
    }

    unpinMessage = async (room_id, message_id) => {
        const message = await pinMessageModel.findByIdAndUpdate(
            room_id,
            { $pull: { message_id } },
            { new: true, runValidators: true }
        );
        if (!message) {
            throw new NotFoundError('Room not found');
        }
        const key = 'pinMessage:' + room_id;
        await RedisService.lRem(key, 0, message_id);
        return message;
    }
}
module.exports = new pinMessageRepository();
