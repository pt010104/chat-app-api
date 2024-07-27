'use strict';

const RoomModel = require('../room.model');
const RedisService = require('../../services/redis.service');

class RoomRepository {
    // Get all rooms
    // Return: Array of room_id
    getAllRooms = async () => {
        const rooms = await RoomModel.find({});
        return rooms;
    }

    createRoom = async (name, avt_url, user_ids) => {
        const newRoom = await RoomModel.create({
            name: name,
            avt_url: avt_url,
            user_ids: user_ids,
            isGroup: user_ids.length > 2 ? true : false
        });
        return newRoom;
    }

    getRoomByUserIDs = async (user_ids) => {
        return await RoomModel.findOne({
            user_ids: { $all: user_ids }
        });
        
    }

    getRoomByUserID = async (user_id) => {
        const type = 'room';
        let room = await RedisService.getMessages(type, user_id);

        if (room.length > 0) {
            return room;
        }

        room = await RoomModel.find({
            user_ids: user_id
        }).lean();

        room.map(async (room) => {
            await RedisService.storeOrUpdateMessage(type, user_id, room);
        });

    
        return room;
    }

    getUserIDsByRoom = async (room_id) => {
        const room = await RoomModel.findById(room_id).lean();
        return room.user_ids;
    }

    addUsersToRoom = async (room_id, usersID) => {
        return await RoomModel.findByIdAndUpdate(room_id, {
            $addToSet: {
                user_ids: { $each: usersID }
            }
        }, { new: true });
    }

    getRoomByID = async (room_id, user_id) => {
        
        return await RoomModel.findById(room_id);
    }
}

module.exports = new RoomRepository();
