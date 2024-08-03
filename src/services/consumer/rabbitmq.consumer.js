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
            const concurrencyLimit = 5; 
            for (let i = 0; i < rooms.length; i += concurrencyLimit) {
                const batch = rooms.slice(i, i + concurrencyLimit);
                await Promise.all(batch.map(room => this.processQueue(room._id.toString()).catch(error => {
                    console.error(`Error in consumer for room ${room._id}:`, error);
                })));
            }
        }
    }

    static async processQueue(roomId) {
        try {
            await RabbitMQService.receiveMessage(roomId, async (message, channel, msg) => {
                try {
                    await this.processMessage(message, roomId);
                } catch (error) {
                    console.error(`Error processing message in room ${roomId}:`, error);
                }
            });
            
            await new Promise(() => {});
        } catch (error) {
            console.error(`Error setting up queue for room ${roomId}:`, error);
        }
    }

    static async processMessage(message, roomId) {
        try {
            const now = new Date();
            message.createdAt = now;
            message.updatedAt = now;

            const [checkRoom, userIDsInRoom] = await Promise.all([
                RoomRepository.getRoomByID(roomId),
                RoomRepository.getUserIDsByRoom(roomId)
            ]);

            if (!checkRoom) {
                throw new Error(`Room not found: ${roomId}`);
            }

            const filteredUserIDs = userIDsInRoom.filter(userId => userId.toString() !== message.user_id.toString());

            await this.notifyAndBroadcast(roomId, filteredUserIDs, message);

            const [saveMessage] = await Promise.all([
                ChatRepository.saveMessage(message.user_id, roomId, message.message, now, now),
                ChatService.updateNewMessagesInRoom(roomId, message)
            ]);

            const transformedMessage = await ChatRepository.transformForClient(saveMessage);

            this.broadcastSavedMessage(roomId, transformedMessage);

        } catch (error) {
            console.error(`Error processing message for room ${roomId}:`, error);
            throw error;
        }
    }

    static async notifyAndBroadcast(roomId, userIDs, message) {
        const io = global._io;
        io.to(roomId).emit("new message notification", { "data": message });
        
        const onlineUserPromises = userIDs.map(async (userId) => {
            const userStatus = await RedisService.getUserStatus(userId);
            if (userStatus === 'online') {
                io.to(`user_${userId}`).emit("new message notification", { "data": message });
            }
        });

        await Promise.all(onlineUserPromises);
    }

    static broadcastSavedMessage(roomId, message) {
        const io = global._io;
        io.to(roomId).emit("chat message", { "data": message });
    }
}

module.exports = RabbitMQConsumer;