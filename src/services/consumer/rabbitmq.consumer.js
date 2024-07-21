const RabbitMQService = require('../rabbitmq.service');
const RoomRepository = require('../../models/repository/room.repository');
const RedisService = require ('../redis.service')
const ChatRepository = require('../../models/repository/chat.repository');

class RabbitMQConsumer {
    static listenForMessages = async() => {
        await RabbitMQService.connect();
        const rooms = await RoomRepository.getAllRooms(); 
        
        if (rooms) {
            rooms.forEach(room => {
                const queueName = String(room._id);
                RabbitMQService.reciveMessage(queueName, async (message) => {
                    await ChatRepository.saveMessage(message.user_id, room._id, message.message);

                    const userIDsInRoom = await RoomRepository.getUserIDsByRoom(room._id); 
                    //Check if user is online
                    userIDsInRoom.forEach(async (userID) => {
                        userID = userID.toString();
                        const userStatus = await RedisService.getUserStatus(userID);
                        if (userStatus === 'online') {
                            global._io.to(room._id).emit("chat message", message);
                        } else {
                            await RedisService.storeUnreadMessage(userID, JSON.stringify(message));
                        }
                    });
                });
            })
        }

    }
}

module.exports = RabbitMQConsumer;
