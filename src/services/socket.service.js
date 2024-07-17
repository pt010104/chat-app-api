const ChatService = require("./chat.service");

class SocketServices {
    constructor(io) {
        this.io = io;
        this.io.on('connection', this.connection.bind(this));
    }

    async connection(socket) {
        const user_id = socket.handShake.query.user_id;
        console.log(`User connected with id ${socket.id} and user_id ${user_id}`);

        await redisService.setUserStatus(user_id, 'online');
        console.log(`User connected with id ${socket.id}`);

        const unreadMessage = await ChatService.getUnreadMessages(user_id);
        unreadMessages.forEach(message => {
            socket.emit('chat message', message);
        });

        socket.on('chat message', this.handleChatMessage.bind(this, socket));
        socket.on('disconnect', this.handleDisconnect.bind(this, socket));
        socket.on('join room', this.handleJoinRoom.bind(this, socket));
        socket.on('error', this.handleError.bind(this, socket));
    }

    async handleChatMessage(socket, user_id, msg) {
        try {
            console.log(`Message received from ${socket.id}: ${msg}`);

            const { room_id, message } = msg;
            const savedMessage = await ChatService.sendMessage(user_id, room_id, message);

            this.io.emit('chat message', savedMessage);  
        } catch (error) {
            console.error(`Error handling message from ${socket.id}: ${error.message}`);
        }
    }

    async handleDisconnect(socket) {
        console.log(`User disconnected with id ${socket.id}`);

        await RedisService.setUserStatus(user_id, 'offline');
    }

    handleJoinRoom(socket, room) {
        console.log(`User ${socket.id} joined room ${room}`);
        socket.join(room);
    }

    handleError(socket, error) {
        console.error(`Error from ${socket.id}: ${error}`);
    }
}

module.exports = SocketServices;  