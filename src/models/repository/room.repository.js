'use strict';

const RoomModel = require('../room.model');
const RedisService = require('../../services/redis.service');
const { findById } = require('../keytoken.model');
const { findUserById } = require('./user.repository');

class RoomRepository {
    transformForClient = async (rooms, userID) => {
        if (Array.isArray(rooms)) {
            let data = [];
            for (let i = 0; i < rooms.length; i++) {
                const room = rooms[i];
                let dataTransformed = {
                    room_id: room._id,  
                    room_name: room.name,
                    is_group: room.is_group,
                    room_user_ids: room.user_ids,
                    room_created_at: room.createdAt,
                    room_updated_at: room.updatedAt
                }
                if (!room.is_group || room.avt_url == "") {
                    if (room.is_group) {
                        const user = await findUserById(room.created_by);
                        if (user && user.avatar) {
                            dataTransformed.room_avatar = user.avatar; 
                        }
                    } else {
                        const user = await findUserById(room.user_ids.filter(id => id != userID)[0]);
                        if (user && user.avatar) {
                            dataTransformed.room_avatar = user.avatar; 
                        }
                    }
                } else {
                    dataTransformed.room_avatar = room.avt_url
                }

                data.push(dataTransformed);
            }
            return data;
        }  else {
            let room_avatar = null;
            if (!rooms.is_group || rooms.avt_url == "") {
                if (rooms.is_group) {
                    const user = await findUserById(rooms.created_by);
                    if (user && user.avatar) {
                        room_avatar  = user.avatar; 
                    }
                } else {
                    const user = await findUserById(rooms.user_ids.filter(id => id != userID)[0]);
                    if (user && user.avatar) {
                        room_avatar  = user.avatar; 
                    }
                }
            } else {
                room_avatar = rooms.avt_url
            }
            return {
                room_id: rooms._id,
                room_name: rooms.name,
                is_group: rooms.is_group,
                room_user_ids: rooms.user_ids,
                room_avatar: room_avatar ?? rooms.avt_url,
                room_created_at: rooms.createdAt,
                room_updated_at: rooms.updatedAt
            };
        }
    }

    transformForDetailRoom = async (rooms, userID) => {
        if (Array.isArray(rooms)) {
            let data = [];
            for (let i = 0; i < rooms.length; i++) {
                const room = rooms[i];
                let dataTransformed = {
                    room_id: room._id,  
                    room_name: room.name,
                    is_group: room.is_group,
                    room_user_ids: room.user_ids,
                    room_created_at: room.createdAt,
                    room_updated_at: room.updatedAt
                }
                if (!room.is_group || room.avt_url == "") {
                    if (room.is_group) {
                        const user = await findUserById(room.created_by);
                        if (user && user.avatar) {
                            dataTransformed.room_avatar = user.avatar; 
                        }
                    } else {
                        const user = await findUserById(room.user_ids.filter(id => id != userID)[0]);
                        if (user && user.avatar) {
                            dataTransformed.room_avatar = user.avatar; 
                        }
                    }
                } else {
                    dataTransformed.room_avatar = room.avt_url
                }

                for (let j = 0; j < rooms.user_ids.length; j++) {
                    const user = await findUserById(rooms.user_ids[j]);
                    if (user) {
                        const room_user = {
                            user_id: user._id,
                            user_name: user.name,
                            user_avatar: user.avatar
                        }

                        dataTransformed = {
                            ...dataTransformed,
                            room_users: room_user
                        }
                    }
                }

                data.push(dataTransformed);
            }
            return data;
        }  else {
            let room_avatar = null;
            if (!rooms.is_group || rooms.avt_url == "") {
                if (rooms.is_group) {
                    const user = await findUserById(rooms.created_by);
                    if (user && user.avatar) {
                        room_avatar  = user.avatar; 
                    }
                } else {
                    const user = await findUserById(rooms.user_ids.filter(id => id != userID)[0]);
                    if (user && user.avatar) {
                        room_avatar  = user.avatar; 
                    }
                }
            } else {
                room_avatar = rooms.avt_url
            }

            let room_users = []

            for (let j = 0; j < rooms.user_ids.length; j++) {
                const user = await findUserById(rooms.user_ids[j]);
                if (user) {
                    const room_user = {
                        user_id: user._id,
                        user_name: user.name,
                        user_avatar: user.avatar
                    }

                    room_users.push(room_user)
                }
            }
            
            return {
                room_id: rooms._id,
                room_name: rooms.name,
                is_group: rooms.is_group,
                room_user_ids: rooms.user_ids,
                room_users: room_users,
                room_avatar: room_avatar ?? rooms.avt_url,
                room_created_at: rooms.createdAt,
                room_updated_at: rooms.updatedAt
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

    createRoom = async (params) => {
        const { name, avt_url, user_ids, userId, auto_name, created_by, name_remove_sign } = params;
        
        const newRoom = await RoomModel.create({
            name: name,
            name_remove_sign: name_remove_sign,
            user_ids: user_ids,
            created_by: created_by,
            is_group: user_ids.length > 2 ? true : false,
            auto_name: auto_name ?? false,
        });

        if (avt_url && newRoom.is_group) {
            newRoom.avt_url = avt_url;
            await newRoom.save();
        }   

        RedisService.delete(`room:${userId}`, newRoom);
        await this.invalidateRoomsCache();
        return newRoom;
    }

    getRoomByUserIDs = async (user_ids) => {
        return await RoomModel.findOne({
            user_ids: { $all: user_ids, $size: user_ids.length }
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

    addUsersToRoom = async (room_id, newUserIds) => {
        const updatedRoom = await RoomModel.findByIdAndUpdate(
            room_id,
            { $addToSet: { user_ids: { $each: newUserIds } } },
            { new: true, runValidators: true }
        );
    
        if (!updatedRoom) {
            throw new Error('Room not found');
        }
    
        return updatedRoom;
    };
    
    findRoomsByUserId = async (userId) => {
        return RoomModel.find({ user_ids: userId }, null, { lean: true });
    };
    
    updateRoom = async (room) => {
        const updatedRoom = await RoomModel.findByIdAndUpdate(room._id, room, { new: true });
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
}

module.exports = new RoomRepository();
