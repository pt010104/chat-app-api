const RabbitMQService = require('../rabbitmq.service');
const RoomRepository = require('../../models/repository/room.repository');
const RedisService = require('../redis.service');
const ChatRepository = require('../../models/repository/chat.repository');
const ChatService = require('../chat.service');

class RabbitMQConsumer {
    static async listenForMessages() {
        await RabbitMQService.connect();
        const rooms = await RoomRepository.getAllRooms();

        if (rooms && rooms.length > 0) {
            await Promise.all(rooms.map(room => this.processQueue(room._id.toString())));
        }
    }

    static async processQueue(roomId) {
        try {
            await RabbitMQService.channel.assertQueue(roomId, { durable: true });
            RabbitMQService.channel.consume(roomId, async (msg) => {
                if (msg !== null) {
                    try {
                        const message = JSON.parse(msg.content.toString());
                        await this.processMessage(message, roomId);
                        RabbitMQService.channel.ack(msg);
                    } catch (error) {
                        console.error(`Error processing message in room ${roomId}:`, error);
                        RabbitMQService.channel.nack(msg);
                    }
                }
            });
        } catch (error) {
            console.error(`Error setting up queue for room ${roomId}:`, error);
        }
    }

    static async processMessage(message, roomId) {
        const [checkRoom, saveMessage, userIDsInRoom] = await Promise.all([
            RoomRepository.getRoomByID(roomId),
            ChatRepository.saveMessage(message.user_id, roomId, message.message),
            RoomRepository.getUserIDsByRoom(roomId)
        ]);

        if (!checkRoom) {
            throw new Error(`Room not found: ${roomId}`);
        }

        const filteredUserIDs = userIDsInRoom.filter(userId => userId.toString() !== message.user_id.toString());
        const transformedMessage = await ChatRepository.transformForClient(saveMessage);

        await Promise.all([
            this.notifyOnlineUsers(filteredUserIDs, transformedMessage),
            this.broadcastToRoom(roomId, transformedMessage),
            ChatService.updateNewMessagesInRoom(roomId, transformedMessage)
        ]);
    }

    static async notifyOnlineUsers(userIDs, message) {
        const notificationPromises = userIDs.map(async (userId) => {
            const userStatus = await RedisService.getUserStatus(userId);
            if (userStatus === 'online') {
                global._io.to(`user_${userId}`).emit("new message", { "data": message });
            }
        });

        await Promise.all(notificationPromises);
    }

    static async broadcastToRoom(roomId, message) {
        global._io.to(roomId).emit("chat message", { "data": message });
    }
}

module.exports = RabbitMQConsumer;