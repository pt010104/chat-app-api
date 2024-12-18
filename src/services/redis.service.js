'use strict';
const { initRedis, getRedis, closeRedis } = require('../dbs/init.redis');

class RedisService {
    constructor() {
        this.redisClient = null;
        this.initPromise = this.initializeClient();
    }

    async initializeClient() {
        try {
            await initRedis();
            this.redisClient = getRedis();
        } catch (error) {
            console.error('RedisService failed to initialize:', error);
            throw error;
        }
    }

    async getClient() {
        await this.initPromise;
        return this.redisClient;
    }

    async executeCommand(command, ...args) {
        const client = await this.getClient();
        try {
            return await client[command](...args);
        } catch (error) {
            console.error(`Redis ${command} error:`, error);
            throw error;
        }
    }

    set(key, value, expiration) {   
        const args = expiration ? [key, value, { EX: expiration }] : [key, value];
        return this.executeCommand('set', ...args);
    }

    get(key) {
        return this.executeCommand('get', key);
    }

    delete(key) {
        return this.executeCommand('del', key);
    }

    exists(key) {
        return this.executeCommand('exists', key);
    }

    keys(pattern) {
        return this.executeCommand('keys', pattern);
    }

    setUserStatus(userId, status) {
        return this.set(userId, status);
    }

    getUserStatus(userId) {
        return this.get(userId);
    }
    
    lRange(key, start, end) {
        return this.executeCommand('lRange', key, start, end);
    }
    
    rPush(key, value) {
        return this.executeCommand('rPush', key, value);
    }
    lRem(key, count, value) {
        return this.executeCommand('lRem', key, count, value);
    }
    
    lLen(key) {
        return this.executeCommand('lLen', key);
    }
    async storeOrUpdateMessage(type, id, message, field = '') {
        const key = `${type}:${id}`;
        
        const existingMessages = await this.executeCommand('lRange', key, 0, -1);
        
        if (field) {
            const messageIndex = existingMessages.findIndex(msg => {
                const parsedMsg = JSON.parse(msg);
                return parsedMsg[field] == message[field];
            });
    
            if (messageIndex !== -1) {
                await this.executeCommand('lSet', key, messageIndex, JSON.stringify(message));
            } else {
                await this.executeCommand('rPush', key, JSON.stringify(message));
            }
        } else {
            await this.executeCommand('rPush', key, JSON.stringify(message));
        }
    }
    
    
    
    async getMessages(type, id) {
        const key = `${type}:${id}`;
    
        let existingMessages;
        existingMessages = await this.executeCommand('lRange', key, 0, -1);
        const parsedMessages = existingMessages.map(msg => JSON.parse(msg));
    
        return parsedMessages;
    }
}

module.exports = new RedisService();    