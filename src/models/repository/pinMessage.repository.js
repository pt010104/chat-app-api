'use strict';


const { BadRequestError } = require('../../core/error.response');
const RedisService = require('../../services/redis.service');
const { NotFoundError } = require('../../core/error.response');
const pinMessageModel = require('../pinMessage.model');



class pinMessageRepository {
    pinMessage = async (room_id, message_id) => {

        let message = await pinMessageModel.findOne({ room_id: room_id });
    
        if (!message) {
            message = await pinMessageModel.create({
                room_id: room_id,
                message_id: [message_id]
            });
            
            const key = `pinMessage:${room_id}`;
            await RedisService.rPush(key, message_id);
        } else {

            const alreadyPinned = message.message_id.includes(message_id);
    
            if (!alreadyPinned) {

                message = await pinMessageModel.findOneAndUpdate(   
                    { room_id: room_id }, 
                    { $addToSet: { message_id } },
                    { new: true, runValidators: true }
                );
    

                const key = `pinMessage:${room_id}`;
                await RedisService.rPush(key, message_id);
            }
        }
    
        if (!message) {
            throw new NotFoundError('Room not found');
        }
    
        return message_id;
    };
    


    unpinMessage = async (room_id, message_id) => {
        const message = await pinMessageModel.findOneAndUpdate(
            { room_id: room_id }, 
            { $pull: { message_id } },
            { new: true, runValidators: true }
        );
        if (!message) {
            throw new NotFoundError('Room not found or no pinned messages');
        }
        const key = 'pinMessage:' + room_id;
        await RedisService.lRem(key, 0, message_id);
        const listLength = await RedisService.lLen(key); 
        if (listLength === 0) {
            await RedisService.delete(key); // Delete the key if the list is empty
        }
        return ;
    }

    getListPinMessage = async (room_id) => {//call when redis is empty
        const key = 'pinMessage:' + room_id;
       
        const message = await pinMessageModel.find({ room_id: room_id });   

        if (!message) {
            throw new NotFoundError('Room not found or no pinned messages');
        }

        const message_id = message.message_id;
        await Promise.all(message_id.map(async (id) => {
            await RedisService.rPush(key, id);
        }));
        return message_id;
    }
}
module.exports = new pinMessageRepository();
