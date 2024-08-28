'use strict';


const { BadRequestError } = require('../../core/error.response');
const RedisService = require('../../services/redis.service');
const { NotFoundError } = require('../../core/error.response');
const pinMessageModel = require('../pinMessage.model');



class pinMessageRepository {
    pinMessage = async (room_id, message_id) => {

        let message = await pinMessageModel.findById(room_id);

        if (!message) {
        
            message = await pinMessageModel.create({
                room_id: room_id,
                message_id: [message_id]
            });
        } else {
            // If a pin exists, update the existing entry to add the new message ID
            message = await pinMessageModel.findByIdAndUpdate(
                room_id,
                { $addToSet: { message_id } },
                { new: true, runValidators: true }
            );
        }

        if (!message) {
            throw new NotFoundError('Room not found');
        }

        // Push the message ID to Redis
        const key = `pinMessage:${room_id}`;
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
