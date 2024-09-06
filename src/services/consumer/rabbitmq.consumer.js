const RabbitMQService = require('../rabbitmq.service');
const RoomRepository = require('../../models/repository/room.repository');
const RedisService = require('../redis.service');
const ChatRepository = require('../../models/repository/chat.repository');
const ChatService = require('../chat.service');
const UploadService = require('../upload.service');
const QueueNames = require('../../utils/queueNames');

class RabbitMQConsumer {
    static async listenForMessages() {
        await RabbitMQService.connect();
        const channel = await RabbitMQService.getChannel();

        await channel.assertQueue(QueueNames.CHAT_MESSAGES, { durable: true });
        await channel.assertQueue(QueueNames.IMAGE_MESSAGES, { durable: true });
        await channel.assertQueue(QueueNames.PRIVATE_CHAT_MESSAGES, { durable: true });
    
        await channel.assertQueue(QueueNames.GIFT_MESSAGES, { durable: true });

        await channel.prefetch(10);

        channel.consume(QueueNames.CHAT_MESSAGES, async (msg) => {
            if (msg) {
                try {
                    const message = JSON.parse(msg.content.toString());
                    const roomId = message.room_id;
                    await this.processMessage(message, roomId);
                    channel.ack(msg);
                } catch (error) {
                    console.error(`Error processing message:`, error);
                    channel.nack(msg, false, false);
                }
            }
        });

        channel.consume(QueueNames.PRIVATE_CHAT_MESSAGES, async (msg) => {
            if (msg) {
                try {
                    const message = JSON.parse(msg.content.toString());
                    const roomId = message.room_id;
                    await this.processMessagePrivate(message, roomId);
                    channel.ack(msg);
                } catch (error) {
                    console.error(`Error processing private message:`, error);
                    channel.nack(msg, false, false);
                }
            }
        });

        channel.consume(QueueNames.IMAGE_MESSAGES, async (msg) => {
            if (msg) {
                try {
                    const message = JSON.parse(msg.content.toString());
                    const { buffer, user_id, room_id } = message;

                    const uploadResult = await UploadService.uploadImageFromBuffer({ buffer, user_id, params: { type: 'message', room_id } });
                    console.log(`Upload result:`, uploadResult);
                    const imageUrl = uploadResult.url;

                    message.image_url = imageUrl;

                    await this.processMessage(message, room_id);

                    channel.ack(msg);
                } catch (error) {
                    console.error(`Error processing image message:`, error);
                    channel.nack(msg, false, false);
                }
            }
        });

        channel.consume(QueueNames.Gift_MESSAGES, async (msg) => {
            if (msg) {
                try {
                    const message = JSON.parse(msg.content.toString());
                    await this.processGiftMessage(message);
                    channel.ack(msg);
                } catch (error) {
                    console.error(`Error processing gift message:`, error);
                    channel.nack(msg, false, false);
                }
            }
        });
    }

    static async processGiftMessage(message) {
        try {
            await ChatRepository.updateMessageGiftStatus(message.id, false);
    
            console.info(`Message ID ${message.id}: is_gift status updated to false`);
        } catch (error) {
            console.error(`Error updating gift status for message ID ${message.id}:`, error);
            throw error;
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

            let type_room = 'normal';
 
            let filteredUserIDs;

            if (checkRoom.user_ids)
            {
                filteredUserIDs = userIDsInRoom.filter(userId => userId.toString() !== message.user_id.toString());
            } else {
                type_room = 'media';
            }

            const [saveMessage] = await Promise.all([
                ChatRepository.saveMessage({
                    user_id: message.user_id,
                    room_id: roomId,
                    message: message.message,
                    image_url: message.image_url || null,
                    created_at: message.createdAt,
                    updated_at: message.updatedAt,
                    is_gift: message.is_gift || false,
                    release_time: message.release_time || null,
                    gift_id: message.gift_id || null
                    
                }),
                ChatService.updateNewMessagesInRoom(roomId, message)
            ]);

            const transformedMessage = await ChatRepository.transformForClient(saveMessage, message.user_id);

            await this.notifyAndBroadcast(roomId, filteredUserIDs, transformedMessage, type_room);
        } catch (error) {
            console.error(`Error processing message for room ${roomId}:`, error);
            throw error;
        }
    }

    static async processMessagePrivate(message, roomId) {
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
                ChatRepository.saveMessage({
                    user_id: message.user_id,
                    room_id: roomId,
                    message: message.message,
                    image_url: message.image_url || null,
                    created_at: message.createdAt,
                    updated_at: message.updatedAt
                }),
                ChatService.updateNewMessagesInRoom(roomId, message)
            ]);

            const transformedMessage = await ChatRepository.transformForClient(saveMessage);
            await this.notifyAndBroadcast(roomId, filteredUserIDs, transformedMessage);

        } catch (error) {
            console.error(`Error processing private message for room ${roomId}:`, error);
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
