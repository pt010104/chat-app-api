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

socket.on('connect', () => {
    const userId = socket.io.opts.query.user_id;
    log(`Connected to server with user ID: ${userId}`);
});

socket.on('connected', (userId) => {
    log(`Successfully joined to channel user_${userId}`);

})

socket.on('ready', () => {
    const roomId = '66981da2388da84552594a90';
    socket.emit('join room', roomId);
});

socket.on('joined room', (roomId) => {
    log(`Successfully joined room: ${roomId}`);
});

socket.on('chat message', (data) => {
    log('Received chat message: ' + JSON.stringify(data));
});

socket.on('new message', (data) => {
    log('Received new message: ' + JSON.stringify(data));
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

function connectRoom(roomId) {
    socket.emit('join room', roomId);
}

document.getElementById('sendMessageButton').addEventListener('click', () => {
    sendMessage('66981da2388da84552594a90', 'Message sent from button');
});

document.getElementById('connectRoomButton').addEventListener('click', () => {
    connectRoom('66981da2388da84552594a90');
});
