let socket;

function log(message) {
    const logArea = document.getElementById('logArea');
    const timestamp = new Date().toISOString();
    logArea.innerHTML += `[${timestamp}] ${message}<br>`;
    logArea.scrollTop = logArea.scrollHeight;
    console.log(`[${timestamp}] ${message}`);
}

document.getElementById('connectButton').addEventListener('click', () => {
    const userIdInput = document.getElementById('userIdInput');
    const roomIdInput = document.getElementById('roomIdInput');
    const userId = userIdInput.value.trim();
    const roomId = roomIdInput.value.trim();

    if (userId && roomId) {
        socket = io('https://chat-app-api2-25ff8770302e.herokuapp.com', {
            query: {
                user_id: userId
            }
        });

        socket.on('connect', () => {
            log(`Connected to server with user ID: ${userId}`);
            socket.emit('join room', roomId);
            document.getElementById('sendMessageButton').disabled = false; // Enable the send button after connection
        });

        socket.on('joined room', (roomId) => {
            log(`Successfully joined room: ${roomId}`);
        });

        socket.on('new message', (data) => {
            log(`Received new message:`);
            if (data && data.data && data.data.message) {
                log(data.data.message);
            }
        });

        socket.on('disconnect', () => {
            log('Disconnected from server');
            document.getElementById('sendMessageButton').disabled = true; // Disable the send button on disconnect
        });

        socket.on('error', (error) => {
            log('Connection error: ' + error);
        });
    } else {
        log('User ID and Room ID cannot be empty');
    }
});

document.getElementById('sendMessageButton').addEventListener('click', () => {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (message && socket) {
        const userId = socket.io.opts.query.user_id;
        const roomId = document.getElementById('roomIdInput').value.trim();
        sendMessage(roomId, message);
    } else {
        log('Cannot send an empty message or socket is not connected');
    }
});

function sendMessage(room_id, message) {
    const messageData = { room_id, message };
    log('Sending message: ' + JSON.stringify(messageData));
    socket.emit('chat message', messageData);
}
