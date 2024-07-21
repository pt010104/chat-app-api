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
                console.log('Room id: ', room._id);
                RabbitMQService.reciveMessage(queueName, async (message) => {
                    await ChatRepository.saveMessage(message.user_id, room._id, message.message);
                    const userIDsInRoom = await RoomRepository.getUserIDsByRoom(room._id); 
                    //Check if user is online
                    userIDsInRoom.forEach(async (userID) => {
                        userID = userID.toString();
                        console.log('User ID: ', userID)
                        const userStatus = await RedisService.getUserStatus(userID);
                        if (userStatus === 'online') {
                            if (global._io) {
                                console.log('global._io is defined, emitting message');
                                global._io.to(room._id.toString()).emit("chat message", { message: message });
                                console.log('Message emitted to room:', room._id.toString());
                            } else {
                                console.error('global._io is not defined');
                            }
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
