const RabbitMQService = require('../rabbitmq.service');
const RoomRepository = require('../../models/repository/room.repository');
const RedisService = require ('../redis.service')

class RabbitMQConsumer {
    static listenForMessages = async() => {
        await RabbitMQService.connect();
        const rooms = await RoomRepository.getAllRooms(); 

        rooms.forEach(room => {
            RabbitMQService.reciveMessage(room._id, async (message) => {

                await ChatRepository.saveMessage(message.user_id, room._id, message.message);

                //Check if user is online
                const userStatus = await RedisService.getUserStatus(message.user_id);
                if (userStatus === 'online') {
                    global._io.to(message.room_id).emit("chat message", message);
                } else {
                    await RedisService.storeUnreadMessage(room.id, JSON.stringify(message));
                }
            });
        })
    }
}

module.exports = RabbitMQConsumer;
