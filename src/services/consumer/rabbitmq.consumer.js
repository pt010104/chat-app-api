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
                if (global._io.sockets.adapter.rooms[room.id]) {
                    global._io.to(room.id).emit("chat message", message);
                } else {
                    //Store unread message in redis
                    await RedisService.set(room.id, JSON.stringify(message));
                }
            });
        })
    }
}

module.exports = RabbitMQConsumer;
