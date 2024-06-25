'use strict';
const { initRedis, getRedis, closeRedis } = require('../dbs/init.redis');

class RedisService {
    constructor() {
        this.redisClient = null;
        this.initializeClient();  
    }

    async initializeClient() {
        try {
            await initRedis(); 
            this.redisClient = getRedis();  
        } catch (error) {
            throw new Error('RedisService failed to initialize.');
        }
    }

    async getClient() {
        if (!this.redisClient) {
            throw new Error('Redis client is not initialized.');
        }
        return this.redisClient;
    }

    async set(key, value, expiration) {
        const client = await this.getClient();
        try {
            if (expiration) {
                await client.set(key, value, { EX: expiration });
            } else {
                await client.set(key, value);
            }
        } catch (error) {
            console.error('Redis set error:', error);
            throw error;
        }
    }

    async get(key) {
        const client = await this.getClient();
        try {
            return await client.get(key);
        } catch (error) {
            console.error('Redis get error:', error);
            throw error;
        }
    }

    async delete(key) {
        const client = await this.getClient();
        try {
            await client.del(key);
            console.log('Key deleted', key);
        } catch (error) {
            console.error('Redis delete error:', error);
            throw error;
        }
    }

    async exists(key) {
        const client = await this.getClient();
        try {
            const exists = await client.exists(key);
            console.log('Key exists:', exists);
            return exists;
        } catch (error) {
            console.error('Redis exists error:', error);
            throw error;
        }
    }

    async close() {
        await closeRedis();
    }
}

module.exports = new RedisService(); 
