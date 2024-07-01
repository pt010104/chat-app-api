'use strict'

const { NotFoundError } = require("../core/error.response")
const ChatModel = require("../models/chat.model")
const ChatRepository = require("../models/repository/chat.repository")
const RoomRepository = require("../models/repository/room.repository")

class ChatService {
    static sendMessage = async (user_id, room_id, message) => {
        
        const checkRoom = await RoomRepository.getRoomByID(room_id)
        if (!checkRoom) {
            throw new NotFoundError("Room not found")
        }

        const saveMessage = await ChatRepository.saveMessage(user_id, room_id, message);
        global._io.to(room_id).emit("chat message", saveMessage)

        return saveMessage
    }

    static createRoom = async (name, avt_link, users) => {

        //Chỉ có trường hợp one-to-one chat mới check exist room
        if(users.length == 2) {
            const checkExistRoom = await RoomRepository.getRoomByUsers(users)
            if(checkExistRoom) {
                throw new BadRequestError("Room already exist")
            }
        }

        const newRoom = await RoomRepository.createRoom(name, avt_link, users);

        return newRoom
    }
}

module.exports = ChatService