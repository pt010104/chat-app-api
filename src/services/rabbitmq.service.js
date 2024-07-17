const amqp = require ('amqplib');

class RabbitMQService {
    constructor() {
        this.connection = null;
        this.channel = null;
    }

    connect = async () => {
        try {
            this.connection = await amqp.connect('amqp://localhost');
            this.channel = await this.connection.createChannel();
            console.log('RabbitMQ connected')
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