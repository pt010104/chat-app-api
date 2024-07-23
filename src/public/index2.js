const socket = io('http://localhost:5050', {
    query: {
        user_id: '668a4c9c1174c565154564c6'
    }
});

function log(message) {
    const logArea = document.getElementById('logArea');
    const timestamp = new Date().toISOString();
    logArea.innerHTML += `[${timestamp}] ${message}<br>`;
    logArea.scrollTop = logArea.scrollHeight;
    console.log(`[${timestamp}] ${message}`);
}

socket.onAny((eventName, ...args) => {
    log(`Received event "${eventName}": ${JSON.stringify(args)}`);
});

socket.on('connect', () => {
    log('Connected to server');
    log('User ID connection: ' + socket.id);

    const roomId = '66981da2388da84552594a90'; 
    socket.emit('join room', roomId);
    log(`Emitted join room for room: ${roomId}`);
});

socket.on('joined room', (roomId) => {
    log(`Joined room: ${roomId}`);
});

socket.on('chat message', (data) => {
    log('Received chat message: ' + JSON.stringify(data));
    try {
        const parsedData = JSON.parse(data); // Parse the JSON string
        if (parsedData && parsedData.message) {
            document.getElementById('messageLabel').innerText = `Received message: ${parsedData.message}`;
        } else {
            log('Error: Received invalid message format');
        }
    } catch (e) {
        log('Error: Unable to parse message - ' + e.message);
    }
});

socket.on('disconnect', () => {
    log('Disconnected from server');
});

socket.on('error', (error) => {
    log('Connection error: ' + error);
});

function sendMessage(room_id, message) {
    const messageData = { room_id, message };
    log('Sending message: ' + JSON.stringify(messageData));
    socket.emit('chat message', messageData);
}

document.getElementById('sendMessageButton').addEventListener('click', () => {
    sendMessage('66981da2388da84552594a90', 'Message sent from button');
});
