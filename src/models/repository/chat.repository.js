'use strict';

const ChatModel = require('../chat.model');
const RoomRepository = require('./room.repository');
const { BadRequestError } = require('../../core/error.response');
const { findUserById } = require('./user.repository');
const RedisService = require('../../services/redis.service');
const { chat } = require('googleapis/build/src/apis/chat');
const E2EEService = require('../../services/E2EE.service');
const MESSAGES_PER_PAGE = 12;

class ChatRepository {
    transform(chatData) {
        return {
            user_id: chatData.user_id.toString(),
            message: chatData.message,
            updated_at: chatData.updatedAt,
            created_at: chatData.createdAt,
            status: chatData.status,
            room_id: chatData.room_id.toString()
        };
    }

    transformForClient = async(chatData, userId) => {
        try {
            const user = await findUserById(chatData.user_id);
            const user_name = user.name;
            const user_avatar = user.avatar;
            const user_avatar_thumb = user.thumb_avatar;

            const transformedData = {
                user_id: chatData.user_id.toString(),
                message: chatData.message,
                updated_at: chatData.updatedAt,
                created_at: chatData.createdAt,
                status: chatData.status,
            };

            if (user_name) {
                transformedData.user_name = user_name;
            }
            if (user_avatar) {
                transformedData.user_avatar = user_avatar;
            }
            if (user_avatar_thumb) {
                transformedData.user_avatar_thumb = user_avatar_thumb;
            }
            if (chatData.image_url) {
                transformedData.image_url = chatData.image_url;
            }
            if (chatData.is_gift) {
                transformedData.is_gift = chatData.is_gift;
            }
            if (chatData.release_time) {
                transformedData.release_time = chatData.release_time;   
            }
            if (chatData._id) {
                transformedData.id = chatData._id;
            }
            if (chatData.likes) {
                transformedData.likes = chatData.likes;
            }
            if (chatData.liked_by && chatData.liked_by.length > 0) {
                transformedData.liked_by = chatData.liked_by;
            }
            if (chatData.liked_by && chatData.liked_by.includes(userId)) {
                transformedData.is_liked = true;
            }
            
            return transformedData;
        } catch (error) {
            return
        }
    }

    getMessageById = async (id) => {
        const message = await ChatModel.findById(id);
        return message;
    }

    updateRedisCache = async (room_id) => {
        const messageKeyPattern = `room:messages:${room_id}:*`;
        const countKey = `room:messages:count:${room_id}`;

        const messageKeys = await RedisService.keys(messageKeyPattern);
        const keysToDelete = [...messageKeys, countKey];

        if (keysToDelete.length > 0) {
            return RedisService.delete(keysToDelete);
        }

        return Promise.resolve();
    }

    saveMessage = async ({user_id, room_id, message, image_url = null, created_at, updated_at, is_gift, release_time, gift_id}) => {
        try {
            const newMessage = new ChatModel({
                user_id,
                room_id,
                message,
                image_url,
                is_gift,
                createdAt: created_at,
                updatedAt: updated_at,
                release_time: release_time || null,
                gift_id: gift_id || null,
                likes: 0
            });

            const [savedMessage] = await Promise.all([
                newMessage.save(),
                this.updateRedisCache(room_id)
            ]);

            return savedMessage;
        } catch (error) {
            throw new BadRequestError(error.message || error);
        }
    }


    getMessagesByRoomId = async (room_id, skip = 0, limit = MESSAGES_PER_PAGE) => {
        const key = `room:messages:${room_id}:${skip}:${limit}`;
        const room = await RoomRepository.getRoomByID(room_id);
        console.log('Room from Repository:', room);
        const type_group = room?.type_group || 'default_value';
        console.log('Type Group:', type_group);
        let cachedMessages = await RedisService.get(key);
        if (cachedMessages) {
            const messages = JSON.parse(cachedMessages);
            if (type_group === 'private') {
                console.log('Decrypting messages cache');
                console.log(`Decrypting ${messages.length} messages for room ${room_id}`);
                const decryptedMessages = await Promise.all(
                    messages.map(async (message) => {
                        const decryptedMessage = await E2EEService.decryptMessage(room_id, message.message);
                        return {
                            ...message,
                            message: decryptedMessage
                        };
                    })  
                );
                return decryptedMessages;
            }
            return messages;
        }
        const messages = await ChatModel.find({ room_id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        if (messages.length > 0) {
            await RedisService.set(key, JSON.stringify(messages)); 
        }

        if (type_group === 'private') {
            console.log(`Decrypting ${messages.length} messages for room ${room_id}`);
            const decryptedMessages = await Promise.all(
                messages.map(async (message) => {
                    const decryptedMessage = await E2EEService.decryptMessage(room_id, message.message);
                    return {
                        ...message,
                        message: decryptedMessage
                    };
                })
            );
            return decryptedMessages;
        }

        return messages;
    }

    countMessagesByRoomId = async (room_id) => {
        const cacheKey = `room:messages:count:${room_id}`;
        let cachedCount = await RedisService.get(cacheKey);

        if (cachedCount !== null) {
            return parseInt(cachedCount, 10);
        }

        const count = await ChatModel.countDocuments({ room_id });
        await RedisService.set(cacheKey, count.toString(), 3600);
        return count;
    }

    clearMessages = async (room_id) => {
        console.log('Clearing messages for room:'+room_id);
        const messages = await ChatModel.deleteMany({ room_id });
        return messages;
    }

    async updateMessageGiftStatus(gift_id, is_gift) {
        const updatedAt = new Date();
        const updatedRecord = await ChatModel.findOneAndUpdate(
            { gift_id },
            { is_gift, updatedAt },
            { new: true } 
        );
        return updatedRecord;
    }
    async updateLikeMessage(messageId, roomId, userId, type = 'like') {
        const updatedAt = new Date();
        let updatedRecord;
    
        if (type === 'like') {
            updatedRecord = await ChatModel.findOneAndUpdate(
                { _id: messageId },
                {
                    $inc: { likes: 1 },
                    $addToSet: { liked_by: userId },
                    updatedAt
                },
                { new: true, upsert: true }
            );
        } else {
            updatedRecord = await ChatModel.findOneAndUpdate(
                { _id: messageId },
                {
                    $inc: { likes: -1 },
                    $pull: { liked_by: userId },
                    updatedAt
                },
                { new: true }
            );
        }
    
        this.updateRedisCache(roomId);
    
        return updatedRecord;
    }
}

module.exports = new ChatRepository();
