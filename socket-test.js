const io = require('socket.io-client');

const socket = io('http://localhost:5050', {
    query: {
        user_id: '6697de6d3786fe3f2bc2c125'  
    }
});

socket.on('connect', () => {
    console.log('Connected to server');
    console.log('User ID  connection: ', socket.id);
})

socket.on('chat message', (data) => {
    console.log('Received chat message:', data);
});


socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

socket.on('error', (error) => {
    console.error('Connection error:', error);
});

function sendMessage(room_id, message) {
    console.log('Sending message:', { room_id, message });
    socket.emit('chat message', { room_id, message });
}

setInterval(() => {
    sendMessage('66981da2388da84552594a90', 'Test message from client');
}, 8000);

process.stdin.resume();

console.log('Socket.IO test client running. Press Ctrl+C to exit.');
