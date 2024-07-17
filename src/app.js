const express = require ("express")
const { default: helmet } = require("helmet")
const morgan = require("morgan")
const compression = require ("compression")
const app = express()
const router = require ("./routes/index")
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);

//Global var
global.__basedir = __dirname;
global._io = io;

//init middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan("dev"))
app.use(helmet())
app.use(compression())

//init db
require("./dbs/init.mongodb")

// Socket.io service
const SocketServices = require('./services/socket.service');
new SocketServices(io)

//Rabbitmq
const RabbitMQConsumer = require('./services/consumer/rabbitmq.consumer');
RabbitMQConsumer.listenForMessages();

//init routes
app.use(router)

//handling error
app.use((req,res,next) => {
    const error = new Error("Not Found The Router")
    error.status = 404
    next(error)
})

app.use((error,req,res,next) => {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message: error.message || 'Internal Server Error'
    })
})

module.exports = app