const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const router = require("./routes/index");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Global variables
global.__basedir = __dirname;
global._io = io;

// Init middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());

// Init DB
require("./dbs/init.mongodb");

// Socket.io service
// const SocketServices = require('./services/socket.service');
// new SocketServices(io);

// RabbitMQ consumer
const RabbitMQConsumer = require('./services/consumer/rabbitmq.consumer');
RabbitMQConsumer.listenForMessages();

// Init routes
app.use(router);

// Handling errors
app.use((req, res, next) => {
    const error = new Error("Not Found The Router");
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message: error.message || 'Internal Server Error'
    });
});

module.exports = { app, server };
