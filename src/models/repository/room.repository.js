'use strict';

const RoomModel = require('../room.model');
const RedisService = require('../../services/redis.service');

class RoomRepository {
    transformForClient = async (rooms) => {
        let data = [];
        for (let i = 0; i < rooms.length; i++) {
            const room = rooms[i];
            let dataTransformed = {
                room_id: room._id,
                room_name: room.name,
                room_avatar: room.avt_url,
                is_group: room.is_group,
                room_user_ids: room.user_ids
            
            }
            data.push(dataTransformed);
        }

        console.log('data', data)

        return data;
    }

    // Get all rooms
    // Return: Array of room_id
    getAllRooms = async () => {
        const rooms = await RoomModel.find({});
        return rooms;
    }

    createRoom = async (name, avt_url, user_ids, user_id) => {
        const newRoom = await RoomModel.create({
            name: name,
            avt_url: avt_url,
            user_ids: user_ids,
            isGroup: user_ids.length > 2 ? true : false
        });

        RedisService.storeOrUpdateMessage('room', user_id, JSON.stringify(newRoom));
        return newRoom;
    }

    getRoomByUserIDs = async (user_ids) => {
        return await RoomModel.findOne({
            user_ids: { $eq: user_ids }
        });
    }

    getRoomsByUserID = async (user_id) => {
        const type = 'room';
        let rooms = await RedisService.getMessages(type, user_id);

        if (rooms.length > 0) {
            return rooms;
        }

        rooms = await RoomModel.find({
            user_ids: user_id
        }).lean();

        rooms.map(async (room) => {
            await RedisService.storeOrUpdateMessage(type, user_id, room);
        });

    
        return rooms;
    }

    getUserIDsByRoom = async (room_id) => {
        const room = await RoomModel.findById(room_id).lean();
        return room.user_ids;
    }

    addUsersToRoom = async (room_id, usersID) => {
        let room = RedisService.get(`room:${room_id}`)
        if (!room) {
            room = RoomModel.findById(room_id).lean()
            room = transformForClient(room)[0]
        }

        room.user_ids.push(usersID)
    }

    getRoomByID = async (room_id, user_id) => {
        const key = `room:${room_id}`
        const room = await RedisService.get(key)
        if (room) {
            return room;
        }
        
        const roomFromDB = await RoomModel.findById(room_id).lean();
        if (roomFromDB) {
            RedisService.set(key, JSON.stringify(roomFromDB), 3600);
        }

        return roomFromDB;
    }
}

module.exports = new RoomRepository();
