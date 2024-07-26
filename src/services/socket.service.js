const ChatService = require("./chat.service");
const RedisService = require("./redis.service");

class SocketServices {
    constructor(io) {
        this.io = io;
        this.io.on('connection', this.connection.bind(this));
    }

    async connection(socket) {
        const user_id = socket.handshake.query.user_id;
        this.log(`User connected with id ${socket.id} and user_id ${user_id}`);
    
        try {
            await RedisService.setUserStatus(user_id, 'online');
            this.log(`User status set to online for user_id ${user_id}`);
    
            const unreadMessages = await ChatService.getUnreadMessages(user_id);
            unreadMessages.forEach(message => socket.emit('chat message', message));
    
            this.registerEventHandlers(socket, user_id);
    
            socket.emit('ready');
        } catch (error) {
            this.log(`Error during user connection setup for user_id ${user_id}: ${error}`);
        }
    }

    registerEventHandlers(socket, user_id) {
        socket.on('chat message', msg => this.handleChatMessage(socket, user_id, msg));
        socket.on('disconnect', () => this.handleDisconnect(socket, user_id));
        socket.on('join room', roomId => this.handleJoinRoom(socket, roomId));
        socket.on('error', error => this.handleError(socket, error));
    }

    async handleChatMessage(socket, user_id, msg) {
        try {
            const { room_id, message } = msg;
            const savedMessage = await ChatService.sendMessage(user_id, room_id, message);
        } catch (error) {
            this.log(`Error handling message for ${user_id}: ${error}`, true);
        }
    }

    async handleDisconnect(socket, user_id) {
        try {
            await RedisService.setUserStatus(user_id, 'offline');
            this.log(`User ${user_id} disconnected and set to offline.`);
        } catch (error) {
            this.log(`Error handling disconnect for ${user_id}: ${error}`, true);
        }
    }

    handleJoinRoom(socket, roomId) {
        socket.join(roomId);
        socket.emit('joined room', roomId);
        this.log(`User ${socket.id} joined room ${roomId}`);
    }

    handleError(socket, error) {
        this.log(`Error from ${socket.id}: ${error}`, true);
    }

    log(message, isError = false) {
        console[isError ? 'error' : 'log'](message);
    }
}

module.exports = SocketServices;
