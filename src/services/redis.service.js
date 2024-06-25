'use strict';
const { getRedis } = require('../dbs/init.redis');

class RedisService {
    constructor() {
        this.redisClient = null;
    }

    initializeClient() {
        if (!this.redisClient) {
            this.redisClient = getRedis();
            if (!this.redisClient) {
                throw new Error('Redis client not available');
            }
        }
    }

    set = async (key, value, expiration) => {
        try {
            this.initializeClient();
            if (expiration) {
                await this.redisClient.set(key, value, { EX: expiration });
            } else {
                await this.redisClient.set(key, value);
            }
        } catch (error) {
            console.error('Redis set error:', error);
            throw error;
        }
    }

    get = async (key) => {
        try {
            this.initializeClient();
            const value = await this.redisClient.get(key);
            return value;
        } catch (error) {
            console.error('Redis get error:', error);
            throw error;
        }
    }

    delete = async (key) => {
        try {
            await this.redisClient.del(key);
            console.log('Key deleted ', key);
            return;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    //Check xem key có tồn tại
    exists = async (key) => {
        try {
            const exists = await this.redisClient.exists(key);
            console.log('Key exists: ', exists);
            return exists;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

module.exports = new RedisService();
