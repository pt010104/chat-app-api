const amqp = require('amqplib');
require('dotenv').config();

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.connecting = false;
        this.reconnectTimeout = null;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
    }

    async connect() {
        if (this.connecting) return;
        this.connecting = true;

        try {
            const amqpUrl = process.env.CLOUDAMQP_URL || 'amqp://localhost';
            this.connection = await amqp.connect(amqpUrl);
            this.channel = await this.connection.createChannel();

            this.connection.on('error', this.handleConnectionError.bind(this));
            this.connection.on('close', this.handleConnectionClose.bind(this));

            console.info("Connected to RabbitMQ successfully");
            this.connecting = false;
            this.reconnectAttempts = 0;
        } catch (error) {
            console.error('Failed to connect to RabbitMQ', error);
            this.handleReconnect();
        }
    }

    handleConnectionError(err) {
        console.error('RabbitMQ connection error', err);
        this.handleReconnect();
    }

    handleConnectionClose() {
        console.error('RabbitMQ connection closed');
        this.handleReconnect();
    }

    handleReconnect() {
        if (this.reconnectTimeout) return;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached. Giving up.');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connecting = false;
            this.connect();
        }, delay);
    }

    async getChannel() {
        if (!this.channel) await this.connect();
        return this.channel;
    }

    async sendMessage(queue, message) {
        try {
            const channel = await this.getChannel();
            await channel.assertQueue(queue, { durable: true });
            channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
        } catch (error) {
            console.error('Error sending message', error);
            throw error;
        }
    }

    async sendMedia(queue, mediaData) {
        try {
            const channel = await this.getChannel();
            await channel.assertQueue(queue, { durable: true });
            channel.sendToQueue(queue, Buffer.from(JSON.stringify(mediaData)), { persistent: true });
        } catch (error) {
            console.error('Error sending media', error);
            throw error;
        }
    }

    async receiveMessage(queue, callback) {
        try {
            const channel = await this.getChannel();
            await channel.assertQueue(queue, { durable: true });
            await channel.prefetch(10);
            channel.consume(queue, (message) => {
                if (message) {
                    try {
                        const parsedMessage = JSON.parse(message.content.toString());
                        callback(parsedMessage, channel, message);
                    } catch (error) {
                        console.error('Error processing message', error);
                        channel.nack(message, false, false);
                    }
                }
            });
        } catch (error) {
            console.error('Error setting up message consumer', error);
            this.handleReconnect();
        }
    }

    async close() {
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await this.connection.close();
            console.log('RabbitMQ connection closed');
        } catch (error) {
            console.error('Error closing RabbitMQ connection', error);
        } finally {
            this.channel = null;
            this.connection = null;
        }
    }
}

module.exports = new RabbitMQService();