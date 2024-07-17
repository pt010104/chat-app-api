class SocketServices {
    constructor(io) {
        this.io = io;
        this.io.on('connection', this.connection.bind(this));
    }

    connection(socket) {
        console.log(`User connected with id ${socket.id}`);

        socket.on('chat message', this.handleChatMessage.bind(this, socket));
        socket.on('disconnect', this.handleDisconnect.bind(this, socket));
        socket.on('join room', this.handleJoinRoom.bind(this, socket));
        socket.on('error', this.handleError.bind(this, socket));
    }

    handleChatMessage(socket, msg) {
        try {
            console.log(`Message received from ${socket.id}: ${msg}`);
            this.io.emit('chat message', msg);  
        } catch (error) {
            console.error(`Error handling message from ${socket.id}: ${error.message}`);
        }
    }

    handleDisconnect(socket) {
        console.log(`User disconnected with id ${socket.id}`);
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