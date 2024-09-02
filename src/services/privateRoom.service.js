'use strict'

const { NotFoundError } = require("../core/error.response")
const E2EEService = require("../services/E2EE.service")
const RabbitMQService = require("./rabbitmq.service")
const { BadRequestError } = require("../core/error.response")
const RedisService = require("./redis.service")
const ChatRepository = require("../models/repository/chat.repository")
const { findUserById } = require("../models/repository/user.repository")
const { removeVietNamese } = require("../utils")
const RoomRepository = require("../models/repository/room.repository")
const QueueNames = require("../utils/queueNames")
const RoomModel = require("../models/room.model")

class PrivateChatService {

    static sendMessagePrivate = async (user_id, room_id, message) => {

        const findRoom = await RoomModel.findById(room_id);
        if (!findRoom) {// vi friend end session
            await E2EEService.clearKeys(room_id);
            throw new BadRequestError("Room not found")
        }
        else if (findRoom.type_group !== 'private') {
            throw new BadRequestError("Invalid Request")
        }
        
        //neu room du key pair, thi lay public key luu o client de encrypt message
        const publicKey = await RoomRepository.getPublicKeyRoom(room, user_id);
        // case ta set public key cho room,sau đó set public key client là null, nhung friend chua accept E2EE, chua set public key cho room,
        //nên ta chưa get key, chua gui message dc, bay gio ta get key
        if (!publicKey) {
            throw new BadRequestError("Don't enough public key to send message, your friend not provide public key")
        }
        const messageEncrypt = await E2EEService.encryptMessage(publicKey, message);
        const chatMessage = {
            user_id,
            message: messageEncrypt,
            room_id,
        }
        await RabbitMQService.sendMessage(QueueNames.PRIVATE_CHAT_MESSAGES, chatMessage);

        return chatMessage
    }

    //this function will be called when user create room or accept E2EE, but this session is end, (new date)
    //this function will create new session, new key pair, set public key for room
    static getAndSetKey = async (room_id, userId) => {
        // const room = await RoomModel.findById(room_id);
        // if (!room) {
        //     throw new NotFoundError("Room not found");
        // }
        // if (room.user_ids[0].toString() !== userId.toString() && room.user_ids[1].toString() !== userId.toString()) {
        //     throw new BadRequestError("You are not in this room")
        // }
        // const hasRoom = await E2EEService.checkPurseHasRoom(room_id);
        // if (!hasRoom) {//not accept E2EE before or your session end(new Date), now accept E2EE and create key pair, or session already end and need create key for new session
        //     const publicKey = await E2EEService.generateKeyPairForRoom(room_id);
        //     await RoomRepository.setPublicKey(room_id, publicKey, userId);
        //     return publicKey;
        // }
        // let {privateKey } = await E2EEService.getPairKeyByRoom(room_id);
        // if ( privateKey && room.public_Key_1 && room.public_Key_2) {
        //     return;
        // }
        // //case your friend or you end session, you create new key, you set public key for room, but you don't set public key for your device
        // if (privateKey ) {
        //     const publicKey= await RoomRepository.getPublicKeyRoom(room_id, userId);
        //     if (!publicKey) {
        //     await E2EEService.clearKeys(room_id);
        //     const publicKey = await E2EEService.generateKeyPairForRoom(room_id);
        //     await RoomRepository.setPublicKey(room_id, publicKey, userId);
        //     return publicKey;
        //     }
        // }
        
        RabbitMQService.sendScheduledMessage(QueueNames.PRIVATE_CHAT_MESSAGES, room_id);
       
    }

    static createRoom = async (params) => {
        if (params.user_ids.length !== 1) {
            throw new BadRequestError("Invalid Request")
        }

        // Nếu user_ids không chứa id của user hiện tại thì thêm vào 
        if (!params.user_ids.includes(params.userId)) {
            params.user_ids.push(params.userId);
        }

        //Chỉ có trường hợp one-to-one chat mới check exist room
        if (params.user_ids.length == 2) {
            const checkExistRoom = await RoomRepository.getRoomByUserIDs(params.user_ids)
            if (checkExistRoom) {
                return RoomRepository.transformForClient(checkExistRoom, params.userId)
            }
        }

        //Tên group:
        //Trường hợp user_ids.length = 2 thì tên group là tên của user còn lại, room_avt không cần set, trong transform xử sau
        if (params.user_ids.length == 2) {
            const friend_user_id = params.user_ids.filter(id => id !== params.userId)[0];

            const user = await findUserById(friend_user_id);
            params.name = user.name
            params.auto_name = true
        }

        // 

        params.type_group = 'private';
        params.created_by = params.userId
        params.name_remove_sign = removeVietNamese(params.name);

        let newRoom = await RoomRepository.createRoomPrivate(params);
        let publicKey = await E2EEService.generateKeyPairForRoom(newRoom._id);
        RabbitMQService.sendScheduledMessage(QueueNames.PRIVATE_CHAT_MESSAGES, newRoom._id);
        newRoom == await RoomModel.findByIdAndUpdate({
            _id: newRoom._id,
        }, {
            public_Key_1: publicKey
        });
        await E2EEService.setPublicKeyByRoom(newRoom._id, null);
        newRoom = await RoomRepository.transformForClient(newRoom, params.userId);
        return newRoom
    }

    static async detailRoom(room_id, userId) {
        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found")
        }

        return RoomRepository.transformForDetailRoom(room, userId)
    }

    static async getNewMessagesEachRoom(userId) {
        const rooms = await RoomRepository.getRoomsByUserID(userId);
        const roomsTransformed = await RoomRepository.transformForClient(rooms, userId);

        const messagePromises = rooms.map(room =>
            RedisService.get('newMessage:' + room._id).then(async message => {
                if (message) {
                    const messageDecrypt = await E2EEService.decryptMessage(room._id, message);
                    const transformedData = await ChatRepository.transformForClient(JSON.parse(messageDecrypt));
                    return { message: transformedData };
                }
                return null;
            })
        );

        const messageResults = await Promise.all(messagePromises);

        return roomsTransformed.map((room, index) => ({
            room,
            newMessage: messageResults[index]?.message
        }));
    }

    static async updateNewMessagesInRoom(roomId, message) {
        const key = 'newMessage:' + roomId;
        await RedisService.set(key, JSON.stringify(message));
    }

    static async getMessagesInRoom(room_id, page = 1, limit = 12) {
        const skip = (page - 1) * limit;

        const [room, messages, totalMessages] = await Promise.all([
            RoomRepository.getRoomByID(room_id),
            ChatRepository.getMessagesByRoomId(room_id, skip, limit),
            ChatRepository.countMessagesByRoomId(room_id)
        ]);

        if (!room) {
            throw new NotFoundError("Room not found");
        }

        const transformedMessages = await Promise.all(
            messages.map(message => ChatRepository.transformForClient(message))
        );

        const totalPages = Math.ceil(totalMessages / limit);

        return {
            messages: transformedMessages,
            currentPage: parseInt(page),
            totalPages,
            amount: transformedMessages.length,
            totalMessages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        };
    }

    static async updateRoom(params) {
        const room = await RoomRepository.getRoomByID(params.room_id);
        if (!room) {
            throw new NotFoundError("Room not found");
        }

        if (params.name) {
            room.name = params.name;
            room.auto_name = false;
        }

        if (params.avt_url && room.is_group) {
            room.avt_url = params.avt_url;
        }

        const updatedRoom = await RoomRepository.updateRoom(room);
        await RoomRepository.updateRedisCacheForRoom(updatedRoom);

        return RoomRepository.transformForClient(updatedRoom, params);
    }

    static async searchRoom(userId, filter) {
        const rooms = await RoomRepository.getRoomsByUserID(userId);

        console.log(rooms)

        filter = removeVietNamese(filter);
        const regex = new RegExp(filter, 'i');

        const filteredRooms = rooms.filter(room => {
            const roomName = room.name_remove_sign;
            return regex.test(roomName);
        });

        const transformedRooms = await Promise.all(filteredRooms.map(room => RoomRepository.transformForClient(room, userId)));

        return transformedRooms;
    }

    static endE2EE = async (room_id) => {
        await E2EEService.clearKeys(room_id);
        const message = await ChatRepository.clearMessages(room_id);
        await RoomModel.findByIdAndUpdate(room_id, {
            public_Key_1: null,
            public_Key_2: null
        });
        return message;
    }

    static resetPrivateRoom = async (room_id) => {
        //delete public key and delete all chat releated to this room
        const message = await ChatRepository.clearMessages(room_id);
        await RoomModel.findByIdAndUpdate(room_id, {
            public_Key_1: '',
            public_Key_2: ''
        });
        return message;
    }

    static deleteRoom = async (room_id) => {
        const room = await RoomRepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found");
        }
        const message = await ChatRepository.clearMessages(room_id);
        await RoomRepository.deleteRoom(room_id);
        return message;
    }



}

module.exports = PrivateChatService;