'use strict'

const redis = require('redis')
require('dotenv').config();

let client = {}
let statusConnectRedis = {
    CONNECT: 'connect',
    END: 'end',
    RECONNECT: 'reconnect',
    ERROR: 'error'
}

const handleEventConnect = ({
    connectionRedis
}) => {
    connectionRedis.on(statusConnectRedis.CONNECT, () => {
        console.log('Redis connected')
    })

    connectionRedis.on(statusConnectRedis.END, () => {
        console.log('Redis disconnected')
    })

    connectionRedis.on(statusConnectRedis.RECONNECT, () => {
        console.log('Redis attempting to reconnect');
    });
    

    connectionRedis.on(statusConnectRedis.ERROR, (err) => {
        console.log('Redis error: ', err)
    })

}

const initRedis = async () => {
    const redis_url = `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

    const instanceRedis = redis.createClient({
        url: redis_url,
    });

    client.instanceRedis = instanceRedis;
    handleEventConnect({ connectionRedis: instanceRedis });

    await instanceRedis.connect().catch(err => {
        console.error('Failed to connect to Redis:', err);
    });

}

const getRedis = () => {
    return client.instanceRedis;
}

const closeRedis = () => {
    client.instanceRedis.quit();
}

module.exports = {
    initRedis,
    getRedis,
    closeRedis
}