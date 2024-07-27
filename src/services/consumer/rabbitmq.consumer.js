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

                    let userIDsInRoom = await RoomRepository.getUserIDsByRoom(room._id); 
                    //Bỏ userId hiện tại
                    userIDsInRoom = userIDsInRoom.filter(userId => userId.toString() !== message.user_id.toString());

                    userIDsInRoom.forEach(async (userID) => {
                        userID = userID.toString();
                        const transformedMessage = await ChatRepository.transformForClient(saveMessage);
                        
                        const userStatus = await RedisService.getUserStatus(userID);
                        if (userStatus === 'online') {
                            global._io.to(`user_${userID}`).emit("new message", { "data": transformedMessage });
                            global._io.to(room._id.toString()).emit("chat message", {"data": transformedMessage });
                        }
                        await ChatService.updateNewMessagesInRoom(room._id, transformedMessage); 
                    });
                });
            })
        }

    }
}

module.exports = RabbitMQConsumer;
