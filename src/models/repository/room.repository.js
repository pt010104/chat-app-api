'use strict';

const RoomModel = require('../room.model');

class RoomRepository {
    // Get all rooms
    // Return: Array of room_id
    getAllRooms = async () => {
        const rooms = await RoomModel.find();
        return rooms;
    }

    createRoom = async (name, avt_link, users) => {
        const newRoom = await RoomModel.create({
            name: name,
            avt_link: avt_link,
            users: users,
            isGroup: users.length > 2 ? true : false
        });
        return newRoom;
    }

    getRoomByUsers = async (users) => {
        return await RoomModel.findOne({
            users: { $all: users },
            isGroup: false
        });
    }

    addUsersToRoom = async (room_id, usersID) => {
        return await RoomModel.findByIdAndUpdate(room_id, {
            $addToSet: {
                users: { $each: usersID }
            }
        }, { new: true });
    }

    getRoomByID = async (room_id) => {
        return await RoomModel.findById(room_id);
    }
}

module.exports = new RoomRepository();
