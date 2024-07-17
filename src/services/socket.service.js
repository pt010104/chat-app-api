const ChatService = require("./chat.service");
const RedisService = require("./redis.service");

class SocketServices {
    constructor(io) {
        this.io = io;
        this.io.on('connection', this.connection.bind(this));
    }

    async connection(socket) {
        const user_id = socket.handshake.query.user_id;
        console.log(`User connected with id ${socket.id} and user_id ${user_id}`);

        await RedisService.setUserStatus(user_id, 'online');
        console.log(`User status set to online for user_id ${user_id}`);

        const unreadMessages = await ChatService.getUnreadMessages(user_id);
        unreadMessages.forEach(message => {
            socket.emit('chat message', message);
        });

        socket.on('chat message', (msg) => this.handleChatMessage(socket, user_id, msg));
        socket.on('disconnect', () => this.handleDisconnect(socket, user_id));
        socket.on('join room', (room) => this.handleJoinRoom(socket, room));
        socket.on('error', (error) => this.handleError(socket, error));
    }

    async handleChatMessage(socket, user_id, msg) {
        try {
            console.log(`Message received from ${socket.id}: ${msg}`);

            const { room_id, message } = msg;
            const savedMessage = await ChatService.sendMessage(user_id, room_id, message);

            this.io.to(room_id).emit('chat message', savedMessage);  // Emit to the specific room
        } catch (error) {
            console.error(`Error handling message from ${socket.id}: ${error.message}`);
        }
    }

    async handleDisconnect(socket, user_id) {
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
