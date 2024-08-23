const socket = io('https://chat-app-api2-25ff8770302e.herokuapp.com', {
    query: {
        user_id: '6697de6d3786fe3f2bc2c125'
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

document.getElementById('sendMessageButton').addEventListener('click', () => {
    sendMessage('66981da2388da84552594a90', 'Message sent from buttonkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk');
});
