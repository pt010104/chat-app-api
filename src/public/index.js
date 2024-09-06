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
        socket = io('localhost:5050', {
            query: {
                user_id: userId
            }
        });

        socket.on('connect', () => {
            log(`Connected to server with user ID: ${userId}`);
            document.getElementById('sendMessageButton').disabled = false;
        });

        socket.on('ready', () => {
            socket.emit('join user', userId);
            socket.emit('join room', roomId);
        });

        socket.on('ready', () => {
            socket.emit('join room', roomId);
        });

        socket.on('joined room', (roomId) => {
            log(`Successfully joined room: ${roomId}`);
        });

        socket.on('joined user', (userId) => {
            log(`Successfully joined user channel: ${userId}`);
        });

        socket.on('new message', (data) => {
            log(`Received new message:`);
            if (data && data.data && data.data.message) {
                log(JSON.stringify(data.data));
            }
        });
        
        socket.on('edited message', (data) => {
            log(`Received edited message:`);
            if (data && data.data && data.data.message) {
                log(JSON.stringify(data.data));
            }
        });

        socket.on('deleted message', (data) => {
            log(`Received deleted message:`);
            if (data && data.data && data.data.message) {
                log(JSON.stringify(data.data));
            }
        });

        socket.on('disconnect', () => {
            log('Disconnected from server');
            document.getElementById('sendMessageButton').disabled = true;
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
    const imageInput = document.getElementById('imageInput');
    const message = messageInput.value.trim();
    const imageFile = imageInput.files[0];

    if (message || imageFile) {
        const userId = socket.io.opts.query.user_id;
        const roomId = document.getElementById('roomIdInput').value.trim();

        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const base64String = event.target.result;
                sendMessage(roomId, message, base64String);
            };
            reader.readAsDataURL(imageFile);
        } else {
            sendMessage(roomId, message, null);
        }
    } else {
        log('Cannot send an empty message or socket is not connected');
    }
});

document.getElementById('editMessageButton').addEventListener('click', () => {
    const roomId = document.getElementById('roomIdInput').value.trim();
    const messageId = document.getElementById('editMessageIdInput').value.trim();
    const newMessage = document.getElementById('newMessageInput').value.trim();

    if (roomId && messageId && newMessage) {
        editMessage(roomId, messageId, newMessage);
    } else {
        log('Room ID, Message ID, and new message content cannot be empty');
    }
});

document.getElementById('deleteMessageButton').addEventListener('click', () => {
    const roomId = document.getElementById('roomIdInput').value.trim();
    const messageId = document.getElementById('deleteMessageIdInput').value.trim();

    if (roomId && messageId) {
        deleteMessage(roomId, messageId);
    } else {
        log('Room ID and Message ID cannot be empty');
    }
});

function sendMessage(room_id, message, imageData) {
    const messageData = { room_id, message };
    if (imageData) {
        messageData.buffer = imageData;
    }
    log('Sending message: ' + JSON.stringify(messageData));
    socket.emit('chat message', messageData);
}

function editMessage(room_id, message_id, new_message) {
    const messageData = { room_id, message_id, message: new_message };
    log('Editing message: ' + JSON.stringify(messageData));
    socket.emit('edit message', messageData);
}

function deleteMessage(room_id, message_id) {
    const messageData = { room_id, message_id };
    log('Deleting message: ' + JSON.stringify(messageData));
    socket.emit('delete message', messageData);
}
