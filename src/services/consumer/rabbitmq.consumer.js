const RabbitMQService = require('../rabbitmq.service');
const RoomRepository = require('../../models/repository/room.repository');
const RoomE2EERepository = require('../../models/repository/roomE2EE.repository');
const RedisService = require('../redis.service');
const ChatRepository = require('../../models/repository/chat.repository');
const ChatService = require('../chat.service');
const E2EEService = require('../E2EE.service');

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
            const channel = await RabbitMQService.getChannel();
            await channel.assertQueue(roomId, { durable: true });
            await channel.prefetch(10); 

            await channel.consume(roomId, async (msg) => {
                if (msg) {
                    try {
                        const message = JSON.parse(msg.content.toString());
                        await this.processMessage(message, roomId);
                        channel.ack(msg);
                    } catch (error) {
                        console.error(`Error processing message in room ${roomId}:`, error);
                        channel.nack(msg, false, false); 
                    }
                }
            });

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


            const [saveMessage] = await Promise.all([
                ChatRepository.saveMessage(message.user_id, roomId, message.message, now, now),
                ChatService.updateNewMessagesInRoom(roomId, message)
            ]);

            const transformedMessage = await ChatRepository.transformForClient(saveMessage);
            await this.notifyAndBroadcast(roomId, filteredUserIDs, transformedMessage);

        } catch (error) {
            console.error(`Error processing message for room ${roomId}:`, error);
            throw error;
        }
    }

    static async processMessagePrivate(message,roomId) {
        try {
            const now = new Date();
            message.createdAt = now;
            message.updatedAt = now;

            const [checkRoom, userIDsInRoom] = await Promise.all([
                //here
                RoomRepository.getRoomByID(roomId),
                RoomRepository.getUserIDsByRoom(roomId)
            ]);

            if (!checkRoom) {
                throw new Error(`Room not found: ${roomId}`);
            }

            const filteredUserIDs = userIDsInRoom.filter(userId => userId.toString() !== message.user_id.toString());

            const [saveMessage] = await Promise.all([
                ChatRepository.saveMessage(message.user_id, roomId, message.message, now, now),
                ChatService.updateNewMessagesInRoom(roomId, message)
            ]);

            const transformedMessage = await ChatRepository.transformForClient(saveMessage);
            await this.notifyAndBroadcast(roomId, filteredUserIDs, transformedMessage);

        } catch (error) {
            console.error(`Error processing message for room ${roomId}:`, error);
            throw error;
        }
    }
    static async notifyAndBroadcast(roomId, userIDs, message) {
        const io = global._io;
        io.to(roomId).emit("new message", { "data": message });
        
        const onlineUserPromises = userIDs.map(async (userId) => {
            const userStatus = await RedisService.getUserStatus(userId);
            if (userStatus === 'online') {
                io.to(`user_${userId}`).emit("chat message", { "data": message });
            }
        });

        await Promise.all(onlineUserPromises);
    }
}

module.exports = RabbitMQConsumer;