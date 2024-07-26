const RabbitMQService = require('../rabbitmq.service');
const RoomRepository = require('../../models/repository/room.repository');
const RedisService = require ('../redis.service')
const ChatRepository = require('../../models/repository/chat.repository');
const ChatService = require('../chat.service');

class RabbitMQConsumer {
    static listenForMessages = async() => {
        await RabbitMQService.connect();
        const rooms = await RoomRepository.getAllRooms(); 
        
        if (rooms) {
            rooms.forEach(room => {
                const queueName = String(room._id);
                RabbitMQService.receiveMessage(queueName, async (message) => {

                    const saveMessage = await ChatRepository.saveMessage(message.user_id, room._id, message.message);
                    await ChatService.updateNewMessagesInRoom(room._id, message.user_id, saveMessage);

                    let userIDsInRoom = await RoomRepository.getUserIDsByRoom(room._id); 
                    //Bỏ userId hiện tại
                    userIDsInRoom = userIDsInRoom.filter(userId => userId.toString() !== message.user_id.toString());

                    userIDsInRoom.forEach(async (userID) => {
                        userID = userID.toString();

                        message = {
                            ...message,
                            id: saveMessage._id,
                        }
                        
                        const userStatus = await RedisService.getUserStatus(userID);
                        if (userStatus === 'online') {
                            global._io.to(room._id.toString()).emit("chat message", { message: message });
                        } else {
                            $type = 'unread';
                            await RedisService.storeMessage(type, userID, JSON.stringify(message));
                        }
                    });
                });
            })
        }

    }
}

module.exports = RabbitMQConsumer;
