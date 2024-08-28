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
            document.getElementById('sendMessageButton').disabled = false; // Enable the send button after connection
        });

        socket.on('ready', () => {
            socket.emit('join room', roomId);
        });

        socket.on('joined room', (roomId) => {
            log(`Successfully joined room: ${roomId}`);
        });

        socket.on('new message', (data) => {
            log(`Received new message: ${data.data.message}`);
            appendMessageToLog(data.data.message, data.data.message_id);
        });

        socket.on('message edited', (data) => {
            log(`Message edited: ${data.message}`);
            updateMessageInLog(data.message, data.message_id);
        });

        socket.on('message deleted', (messageId) => {
            log(`Message deleted: ${messageId}`);
            removeMessageFromLog(messageId);
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
        messageInput.value = '';
    } else {
        log('Cannot send an empty message or socket is not connected');
    }
});

document.getElementById('editMessageButton').addEventListener('click', () => {
    const editMessageIdInput = document.getElementById('editMessageIdInput').value.trim();
    const newMessageInput = document.getElementById('newMessageInput').value.trim();
    const roomId = document.getElementById('roomIdInput').value.trim();

    if (editMessageIdInput && newMessageInput && socket) {
        editMessage(roomId, editMessageIdInput, newMessageInput);
        document.getElementById('editMessageIdInput').value = '';
        document.getElementById('newMessageInput').value = '';
    } else {
        log('Cannot edit message, input or message ID is missing');
    }
});

document.getElementById('deleteMessageButton').addEventListener('click', () => {
    const deleteMessageIdInput = document.getElementById('deleteMessageIdInput').value.trim();
    const roomId = document.getElementById('roomIdInput').value.trim();

    if (deleteMessageIdInput && socket) {
        deleteMessage(roomId, deleteMessageIdInput);
        document.getElementById('deleteMessageIdInput').value = '';
    } else {
        log('Cannot delete message, message ID or socket is missing');
    }
});

function appendMessageToLog(message, messageId) {
    const logArea = document.getElementById('logArea');
    const messageElement = document.createElement('div');
    messageElement.classList.add('message-item');
    messageElement.id = messageId;
    messageElement.innerHTML = `
        <span>${message}</span>
        <button class="editButton" onclick="startEditingMessage('${messageId}', '${message}')">Edit</button>
        <button class="deleteButton" onclick="startDeletingMessage('${messageId}')">Delete</button>
    `;
    logArea.appendChild(messageElement);
}

function updateMessageInLog(message, messageId) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        messageElement.querySelector('span').textContent = message;
    }
}

function removeMessageFromLog(messageId) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        messageElement.remove();
    }
}

function startEditingMessage(messageId, message) {
    document.getElementById('editMessageIdInput').value = messageId;
    document.getElementById('newMessageInput').value = message;
}

function startDeletingMessage(messageId) {
    document.getElementById('deleteMessageIdInput').value = messageId;
}

function sendMessage(room_id, message) {
    const messageData = { room_id, message };
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
