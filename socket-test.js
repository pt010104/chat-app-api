const io = require('socket.io-client');

// Replace with your server's URL and port
const socket = io('http://localhost:5050', {
    query: {
        user_id: 'test_user_123'  // You can change this to any user ID you want to test with
    }
});

socket.on('connect', () => {
    console.log('Connected to server');
    
    // Send a test message
    sendMessage('Hello from Node.js client');
});

socket.on('chat message', (data) => {
    console.log('Received chat message:', data);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

function sendMessage(message) {
    console.log('Sending message:', message);
    socket.emit('chat message', message);
}

// Simulate sending messages every 5 seconds
setInterval(() => {
    sendMessage('Periodic message from client');
}, 5000);

// Keep the script running
process.stdin.resume();

console.log('Socket.IO test client running. Press Ctrl+C to exit.');