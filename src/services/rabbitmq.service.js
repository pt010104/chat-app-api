const amqp = require ('amqplib');
require('dotenv').config();

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
    }

    connect = async () => {
        try {
            const amqpUrl = process.env.CLOUDAMQP_URL  || 'amqp://localhost';
            this.connection = await amqp.connect(amqpUrl);
            this.channel = await this.connection.createChannel();
            console.info("connect to RabbitMQ success");
        } catch {
            console.error('Failed to connect RabbitMQ')
        }
    }

    sendMessage = async (queue, message) => {
        if (!this.channel) {
            await this.connect();
        }

        await this.channel.assertQueue(queue, {
            durable: true
        })
        this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)))

        console.log('Message sent to queue')
    }

    reciveMessage = async (queue, callback) => {
        if (!this.channel) {
            await this.connect();
        }

        await this.channel.assertQueue(queue, {
            durable: true
        })
        this.channel.consume(queue, (message) => {
            console.log(`Message received from ${queue}: `, message.content.toString());
            callback(JSON.parse(message.content.toString()))
            this.channel.ack(message)
        })
    }
}

module.exports = new RabbitMQService()