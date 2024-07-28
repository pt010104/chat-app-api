'use strict';

const RoomModel = require('../room.model');
const RedisService = require('../../services/redis.service');
const { findById } = require('../keytoken.model');
const { findUserById } = require('./user.repository');

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

        return data;
    }

    // Get all rooms
    // Return: Array of room_id
    getAllRooms = async () => {
        const cacheKey = 'all_rooms';
        
        let rooms = await RedisService.get(cacheKey);
        
        if (rooms) {
            return JSON.parse(rooms);
        }

        rooms = await RoomModel.find({}).lean();

        await RedisService.set(cacheKey, JSON.stringify(rooms), 3600);

        return rooms;
    }

    invalidateRoomsCache = async () => {
        await RedisService.del('all_rooms');
    }

    createRoom = async (name, avt_url, user_ids, user_id) => {
        const newRoom = await RoomModel.create({
            name: name,
            avt_url: avt_url,
            user_ids: user_ids,
            isGroup: user_ids.length > 2 ? true : false
        });

        RedisService.storeOrUpdateMessage('room', user_id, JSON.stringify(newRoom));
        await this.invalidateRoomsCache();
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
            return rooms
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
        const key = `room:${room_id}`;
        let room = await RedisService.get(key);
        if (room) {
            return JSON.parse(room).user_ids;
        }
    
        room = await RoomModel.findById(room_id).lean();
        await RedisService.set(key, JSON.stringify(room));
        return room.user_ids;
    }

    addUsersToRoom = async (room_id, newUserIds, userId) => {
        const userDetailsPromises = newUserIds.map(id => findUserById(id));
        
        const [updatedRoom, userRooms, userDetails] = await Promise.all([
            RoomModel.findByIdAndUpdate(
                room_id,
                { $addToSet: { user_ids: { $each: newUserIds } } },
                { new: true, lean: true }
            ),
            RoomModel.find({ user_ids: userId }, null, { lean: true }),
            Promise.all(userDetailsPromises)
        ]);
    
        if (!updatedRoom) {
            throw new Error('Room not found');
        }
    
        const userNameMap = userDetails.reduce((map, user) => {
            map[user._id] = user.name; 
            return map;
        }, {});
    
        const newUserNames = newUserIds.map(id => userNameMap[id]).filter(Boolean);
        if (newUserNames.length > 0) {
            if (updatedRoom.is_group) {
                updatedRoom.name += `, ${newUserNames.join(', ')}`;
            } else {
                updatedRoom.name = newUserNames[0];
            }
        }
    
        const type = 'room';
        const redisOperations = [
            RedisService.set(`room:${room_id}`, JSON.stringify(updatedRoom)),
            ...userRooms.map(room => 
                RedisService.storeOrUpdateMessage(type, userId, room)
            )
        ];
    
        await Promise.all(redisOperations);
    
        return updatedRoom;
    }

    getRoomByID = async (room_id) => {
        const key = `room:${room_id}`
        const room = await RedisService.get(key)
        if (room) {
            return JSON.parse(room);
        }
        
        const roomFromDB = await RoomModel.findById(room_id).lean();
        if (roomFromDB) {
            RedisService.set(key, JSON.stringify(roomFromDB), 3600);
        }

        return roomFromDB;
    }
}

module.exports = new RoomRepository();
