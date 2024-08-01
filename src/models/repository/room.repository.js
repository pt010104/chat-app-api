'use strict';

const RoomModel = require('../room.model');
const RedisService = require('../../services/redis.service');
const { findById } = require('../keytoken.model');
const { findUserById } = require('./user.repository');

class RoomRepository {
    transformForClient = async (rooms) => {
        if (Array.isArray(rooms)) {
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
        } else {
            return {
                room_id: rooms._id,
                room_name: rooms.name,
                room_avatar: rooms.avt_url,
                is_group: rooms.is_group,
                room_user_ids: rooms.user_ids
            };
        }
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
        await RedisService.delete('all_rooms');
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

    updateRedisCacheForRoom = async (room) => {
        
        const redisOperations = [];
      
        redisOperations.push(RedisService.delete(`room:${room._id}`));
        redisOperations.push(RedisService.delete(`all_rooms`));
        redisOperations.push(RedisService.set(`room:${room._id}`, JSON.stringify(room), 3600));
      
        room.user_ids.forEach(id => {
          redisOperations.push(RedisService.storeOrUpdateMessage('room', id, room, '_id'));
        });
      
        await Promise.all(redisOperations);
      };
      

    addUsersToRoom = async (room_id, newUserIds, userId) => {
        const [updatedRoom, userRooms] = await Promise.all([
          RoomModel.findByIdAndUpdate(
            room_id,
            { $addToSet: { user_ids: { $each: newUserIds } } },
            { new: true, runValidators: true }
          ),
          RoomModel.find({ user_ids: userId }, null, { lean: true })
        ]);
      
        if (!updatedRoom) {
          throw new Error('Room not found');
        }
      
        if (updatedRoom.user_ids.length > 2) {
          updatedRoom.is_group = true;
        }
      
        const userDetailsPromises = updatedRoom.user_ids.map(findUserById);
        const userDetails = await Promise.all(userDetailsPromises);
      
        if (updatedRoom.is_group) {
            const usersName = userDetails.map(user => user.name);
            updatedRoom.name = usersName.join(', ');
        }
      
        await updatedRoom.save();
      
        await this.updateRedisCacheForRoom(updatedRoom);
      
        return updatedRoom;
    };
      

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
    
    removeUsersFromRoom = async (room_id, userIds) => {
        const updatedRoom = await RoomModel.findByIdAndUpdate
        (
            room_id,
            { $pull: { user_ids: { $in: userIds } } },
            { new: true }
        );
    }

    
}

module.exports = new RoomRepository();
