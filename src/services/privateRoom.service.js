'use strict'

const { NotFoundError } = require("../core/error.response")
const RoomE2EERepository = require("../models/repository/roomE2EE.repository")
const E2EEService = require("../services/E2EE.service")
const RabbitMQService = require("./rabbitmq.service")
const { BadRequestError } = require("../core/error.response")
const RedisService = require("./redis.service")
const ChatRepository = require("../models/repository/chat.repository")
const { findUserById } = require("../models/repository/user.repository")
const { removeVietNamese } = require("../utils")
const roomE2EEModel = require("../models/roomE2EE.model")
const roomE2EERepository = require("../models/repository/roomE2EE.repository")

class ChatService {


    static sendMessagePrivate = async (user_id, room_id, message) => {
        const chatMessage = {
            user_id,
            message,
            room_id,
        }
        //encrypt message
        //truoc khi gui detect xem co room_id trong danh sach roomE2EE khong, detect trong purse co room_id khong, neu co thi lay public key cua room do de encrypt message, 
        //neu khong thi 
        //neu co thi lay public key cua room do de encrypt message
        const findRoom = await roomE2EEModel.findById(room_id);
        if(!findRoom){// vi friend end session
            await E2EEService.clearKeys(room_id);
            throw new BadRequestError("Room not found")
        }
        else{
            //vd case ta da generate key pair, 
            //set public key cho room, nhung friend chua accept E2EE, chua set public key cho room, chua gui message dc
            if(!findRoom.publicKey1||findRoom.publicKey2){
                throw new BadRequestError("Don't enough public key to send message")
            }
        }
        //neu room du key pair, thi lay public key luu o client de encrypt message
        let publicKey = await E2EEService.getPublicKeyByRoom(room_id);
        // case ta set public key cho room,sau đó set public key client là null, nhung friend chua accept E2EE, chua set public key cho room,
        //nên ta chưa get key, chua gui message dc, bay gio ta get key
        if(!publicKey){
            publicKey = await roomE2EERepository.getPublicKey(room_id,user_id);
            await E2EEService.setPublicKeyByRoom(room_id, publicKey);
        }
        const messageEncrypt = await E2EEService.encryptMessage(message, publicKey);
        await RabbitMQService.sendMessage(room_id, chatMessage);

        return chatMessage 
    }
    
     //this function will be called when user create room or accept E2EE, but this session is end, (new date)
     //this function will create new session, new key pair, set public key for room
    static getAndSetKey = async (room_id,userId) =>  {
        let {publicKey,privateKey} = await E2EEService.getPairKeyByRoom(room_id);
        const room = await roomE2EEModel.findById(room_id);
        if(publicKey&& privateKey&&room){
            return;
        }
        //you already accept E2EE, you already sent public key and you set public key in your device is null, 
        //you wait your friend send public key
        else if(!publicKey&& privateKey){
                publicKey = await roomE2EERepository.getPublicKeyRoom(room_id,userId);
                await E2EEService.setPublicKeyByRoom(room_id, publicKey);            
        }
        else{//you not accept E2EE yet, you need to create key pair, set public key for room
            publicKey=await E2EEService.generateKeyPairForRoom(room_id);

            await roomE2EERepository.setPublicKey(room_id,pu,userId);
        }
    }
    static createRoom = async (params) => {
        if (params.user_ids.length !==1 ) {
            throw new BadRequestError("Invalid Request")
        }

        // Nếu user_ids không chứa id của user hiện tại thì thêm vào 
        if (!params.user_ids.includes(params.userId)) {
            params.user_ids.push(params.userId);
        }

        //Chỉ có trường hợp one-to-one chat mới check exist room
        if(params.user_ids.length == 2) {
            const checkExistRoom = await RoomE2EERepository.getRoomByUserIDs(params.user_ids)
            if(checkExistRoom) {
                return RoomE2EERepository.transformForClient(checkExistRoom, params.userId)
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
        

        params.created_by = params.userId
        params.name_remove_sign = removeVietNamese(params.name);

        let newRoom = await RoomE2EERepository.createRoom(params);
        let publicKey=await E2EEService.generateKeyPairForRoom(newRoom._id);
        newRoom == await roomE2EEModel.findByIdAndUpdate({
            _id:newRoom._id,
        },{
            publicKey1:publicKey
        });
        newRoom = await RoomE2EERepository.transformForClient(newRoom, params.userId);
        await E2EEService.setPublicKeyByRoom(updatedRoom._id, null);
        return newRoom
    }

    static async detailRoom(room_id, userId) {
        const room = await RoomE2EERepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found")
        }

        return RoomE2EERepository.transformForDetailRoom(room, userId)
    }

    static async getNewMessagesEachRoom(userId) {
        const rooms = await RoomE2EERepository.getRoomsByUserID(userId);
        const roomsTransformed = await RoomE2EERepository.transformForClient(rooms, userId);
    
        const messagePromises = rooms.map(room =>
            RedisService.get('Pri newMessage:' + room._id).then(async message => {
                if (message) {
                    const transformedData = await ChatRepository.transformForClient(JSON.parse(message));
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
        const key = 'Pri newMessage:' + roomId;
        await RedisService.set(key, JSON.stringify(message));
    }

    static async getMessagesInRoom(room_id, page = 1, limit = 12) {
        const skip = (page - 1) * limit;
    
        const [room, messages, totalMessages] = await Promise.all([
            RoomE2EERepository.getRoomByID(room_id),
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
        const room = await RoomE2EERepository.getRoomByID(params.room_id);
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

        const updatedRoom = await RoomE2EERepository.updateRoom(room);
        await RoomE2EERepository.updateRedisCacheForRoom(updatedRoom);

        return RoomE2EERepository.transformForClient(updatedRoom, params);
    }

    static async searchRoom(userId, filter) {
        const rooms = await RoomE2EERepository.getRoomsByUserID(userId);

        console.log(rooms)

        filter = removeVietNamese(filter);
        const regex = new RegExp(filter, 'i');
        
        const filteredRooms = rooms.filter(room => {
            const roomName = room.name_remove_sign;
            return regex.test(roomName);
        });

        const transformedRooms = await Promise.all(filteredRooms.map(room => RoomE2EERepository.transformForClient(room, userId)));

        return transformedRooms;
    }

    static async createE2EE(user_id,userId)   {
        
        const newRoom = await RoomE2EERepository.createRoom(
            {
                user_ids: [user_id, userId],               
                name: `Private chat-${user_id}-${userId}`,
            }
        );
        
        
        const publicKey = await E2EEService.generateKeyPairForRoom(newRoom._id);
        const updatedRoom = await roomE2EEModel.findByIdAndUpdate({
            _id:newRoom._id,
        },{
            publicKey1:publicKey
        });
        await E2EEService.setPublicKeyByRoom(updatedRoom._id, null);

        return RoomE2EERepository.transformForClient(updatedRoom, user_id);
    }
    
    static endE2EE = async (room_id) => {
        await E2EEService.clearKeys(room_id);
        const message= await ChatRepository.clearMessages(room_id);
        await roomE2EEModel.findByIdAndDelete(room_id);
        return message;
    }
    
    static acceptE2EE = async (room_id) => {
        const room = await RoomE2EERepository.getRoomByID(room_id);
        if (!room) {
            throw new NotFoundError("Room not found");
        }
        const publicKey =await E2EEService.generateKeyPairForRoom(room_id);
        const updateRoom = await roomE2EEModel.findByIdAndUpdate({
            _id:room._id,
        },{
            publicKey2:publicKey
        });
        E2EEService.setPublicKeyByRoom(updateRoom._id, updateRoom.publicKey1);
        return RoomE2EERepository.transformForClient(updateRoom, user_id);
    }

}

module.exports = ChatService;