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

    setUserStatus(userId, status) {
        return this.set(userId, status);
    }

    getUserStatus(userId) {
        return this.get(userId);
    }
    async storeMessage(type, id, message) {
        const key = `${type}:${id}`;
        return this.executeCommand('rPush', key, JSON.stringify(message));
    }
    
    async getAndClearMessages(type, id) {
        const key = `${type}:${id}`;
        const messages = await this.executeCommand('lRange', key, 0, -1);

        if (type != 'newMessage') {
            await this.delete(key);
        }

        return messages.map(msg => JSON.parse(msg));
    }
    close() {
        return closeRedis();
    }
}

module.exports = new RedisService();