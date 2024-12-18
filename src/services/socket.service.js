const ChatService = require("./chat.service");
const RedisService = require("./redis.service");
const QueueNames = require("../utils/queueNames")

class SocketServices {
    constructor(io) {
        this.io = io;
        this.io.on('connection', this.connection.bind(this));
    }

    async connection(socket) {
        const user_id = socket.handshake.query.user_id;

        try {
            await RedisService.setUserStatus(user_id, 'online');

            //Join vào user_id channel để nhận message từ home
            socket.emit('connected', user_id);

            this.registerEventHandlers(socket, user_id);

            socket.emit('ready');
        } catch (error) {
            this.log(`Error during user connection setup for user_id ${user_id}: ${error}`);
        }
    }

    registerEventHandlers(socket, user_id) {
        socket.on('chat message', msg => this.handleChatMessage(socket, user_id, msg))
        socket.on('new message', msg => this.handleNewMessage(socket, user_id, msg))
        socket.on('edited message', msg => this.handleEditedMessage(socket, user_id, msg))
        socket.on('deleted message', msg => this.handleDeletedMessage(socket, user_id, msg))
        socket.on('pinned message', msg => this.handlePinMessage(socket, user_id, msg))
        socket.on('unpinned message', msg => this.handleUnpinMessage(socket, user_id, msg))
        socket.on('disconnect', () => this.handleDisconnect(socket, user_id))
        socket.on('join room', roomId => this.handleJoinRoom(socket, roomId))
        socket.on('join user', userId => this.handleJoinUser(socket, userId))
        socket.on('read message', (roomId, status) => this.MarkMessage(socket, roomId, status))
        socket.on('error', error => this.handleError(socket, error))
    }
    //
    async handleChatMessage(socket, user_id, msg) {
        try {
            let params = msg;
            params.user_id = user_id;
            const savedMessage = await ChatService.sendMessage(params);
        } catch (error) {
            this.log(`Error handling message for ${user_id}: ${error}`, true);
        }
    }

    async handleNewMessage(socket, user_id, msg) {
        try {
        } catch (error) {
            this.log(`Error handling new message for ${user_id}: ${error}`, true);
        }
    }

    async handleEditedMessage(socket, user_id, msg) {
        try { }
        catch (error) {
            this.log(`Error handling new edited message for ${user_id}: ${error}`, true);
        }
    }

    async handleDeletedMessage(socket, user_id, msg) {
        try {
        } catch (error) {
            this.log(`Error handling delete message for ${user_id}: ${error}`, true);
        }
    }

    async handlePinMessage(socket, user_id, msg) {
        try {
        } catch (error) {
            this.log(`Error handling pin message for ${user_id}: ${error}`, true);
        }
    }

    async handleUnpinMessage(socket, user_id, msg) {
        try {
        } catch (error) {
            this.log(`Error handling unpin message for ${user_id}: ${error}`, true);
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
    }

    handleJoinUser(socket, userId) {
        socket.join(`user_${userId}`);
        socket.emit('joined user', userId);
    }

    handleError(socket, error) {
        this.log(`Error from ${socket.id}: ${error}`, true);
    }

    log(message, isError = false) {
        console[isError ? 'error' : 'log'](message);
    }
}

module.exports = SocketServices;
