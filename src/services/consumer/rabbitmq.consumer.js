const RabbitMQService = require('../rabbitmq.service');
const RoomRepository = require('../../models/repository/room.repository');
const RedisService = require('../redis.service');
const ChatRepository = require('../../models/repository/chat.repository');
const ChatService = require('../chat.service');

class RabbitMQConsumer {
    static async listenForMessages() {
        console.log('Connecting to RabbitMQ...');
        await RabbitMQService.connect();
        const rooms = await RoomRepository.getAllRooms();

        if (rooms && rooms.length > 0) {
            await Promise.all(rooms.map(room => this.processQueue(room._id.toString())));
        }
    }

    static async processQueue(roomId) {
        try {
            await RabbitMQService.receiveMessage(roomId, async (message, channel, msg) => {
                try {
                    console.log(`Received message for room ${roomId}: ${JSON.stringify(message)}`);
                    await this.processMessage(message, roomId);
                } catch (error) {
                    console.error(`Error processing message in room ${roomId}:`, error);
                }
            });
        } catch (error) {
            console.error(`Error setting up queue for room ${roomId}:`, error);
        }
    }

    static async processMessage(message, roomId) {
        try {
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

            console.log(filteredUserIDs, transformedMessage);
            await Promise.all([
                this.notifyOnlineUsers(filteredUserIDs, transformedMessage),
                this.broadcastToRoom(roomId, transformedMessage),
                ChatService.updateNewMessagesInRoom(roomId, transformedMessage)
            ]);

            console.log(`Processed and broadcast message for room ${roomId}`);
        } catch (error) {
            console.error(`Error processing message for room ${roomId}:`, error);
            throw error;
        }
    }

    static async notifyOnlineUsers(userIDs, message) {
        const notificationPromises = userIDs.map(async (userId) => {
            const userStatus = await RedisService.getUserStatus(userId);
            console.log(`User ${userId} status: ${userStatus}`);
            if (userStatus === 'online') {
                console.log(`Emitting message to user ${userId}`);
                global._io.to(`user_${userId}`).emit("new message", { "data": message });
            } else {
                console.log(`User ${userId} is offline`);
            }
        });

        await Promise.all(notificationPromises);
    }

    static async broadcastToRoom(roomId, message) {
        console.log(`Broadcasting message to room ${roomId}`);
        global._io.to(roomId).emit("chat message", { "data": message });
    }
}

module.exports = RabbitMQConsumer;