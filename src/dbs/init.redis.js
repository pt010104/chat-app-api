'use strict'

const redis = require('redis')
require('dotenv').config();

let client = null;
const statusConnectRedis = {
    CONNECT: 'connect',
    END: 'end',
    RECONNECT: 'reconnect',
    ERROR: 'error'
}

const handleEventConnect = (connectionRedis) => {
    connectionRedis.on(statusConnectRedis.CONNECT, () => {
        console.log('Redis connected')
    })

    connectionRedis.on(statusConnectRedis.END, () => {
        console.log('Redis disconnected')
    })

    connectionRedis.on(statusConnectRedis.RECONNECT, () => {
        console.log('Redis attempting to reconnect');
    })

    connectionRedis.on(statusConnectRedis.ERROR, (err) => {
        console.log('Redis error: ', err)
    })
}

const initRedis = async () => {
    const redis_url = `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

    try {
        const instanceRedis = redis.createClient({
            url: redis_url,
        });
        
        handleEventConnect(instanceRedis);

        await instanceRedis.connect();
        
        client = instanceRedis;
        console.log('Redis initialized successfully');
    } catch (err) {
        console.error('Failed to initialize Redis:', err);
        throw err;
    }
}

const getRedis = () => {
    if (!client) {
        throw new Error('Redis client not initialized. Call initRedis() first.');
    }
    return client;
}

const closeRedis = async () => {
    if (client) {
        await client.quit();
        client = null;
        console.log('Redis connection closed');
    }
}

module.exports = {
    initRedis,
    getRedis,
    closeRedis
}