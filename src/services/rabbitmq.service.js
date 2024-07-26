const amqp = require('amqplib');
require('dotenv').config();

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.connecting = false;
        this.reconnectTimeout = null;
    }

    async connect() {
        if (this.connecting) return;
        this.connecting = true;

        try {
            const amqpUrl = process.env.CLOUDAMQP_URL || 'amqp://localhost';
            this.connection = await amqp.connect(amqpUrl);
            this.channel = await this.connection.createChannel();

            this.connection.on('error', (err) => {
                console.error('RabbitMQ connection error', err);
                this.reconnect();
            });

            this.connection.on('close', () => {
                console.error('RabbitMQ connection closed');
                this.reconnect();
            });

            console.info("Connected to RabbitMQ successfully");
            this.connecting = false;
        } catch (error) {
            console.error('Failed to connect to RabbitMQ', error);
            this.reconnect();
        }
    }

    reconnect() {
        if (this.reconnectTimeout) return;
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connecting = false;
            this.connect();
        }, 5000);
    }

    async getChannel() {
        if (!this.channel) await this.connect();
        return this.channel;
    }

    async sendMessage(queue, message) {
        try {
            const channel = await this.getChannel();
            await channel.assertQueue(queue, { durable: true });
            channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
        } catch (error) {
            console.error('Error sending message', error);
            throw error;
        }
    }

    async receiveMessage(queue, callback) {
        try {
            const channel = await this.getChannel();
            await channel.assertQueue(queue, { durable: true });
            channel.consume(queue, (message) => {
                if (message) {
                    console.log(`Message received from ${queue}: `, message.content.toString());
                    try {
                        const parsedMessage = JSON.parse(message.content.toString());
                        callback(parsedMessage);
                        channel.ack(message);
                    } catch (error) {
                        console.error('Error processing message', error);
                        channel.nack(message, false, false);
                    }
                }
            });
        } catch (error) {
            console.error('Error setting up message consumer', error);
            this.reconnect();
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