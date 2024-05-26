    const express = require ("express")
    const { default: helmet } = require("helmet")
    const morgan = require("morgan")
    const compression = require ("compression")
    const app = express()
    const router = require ("./routes/index")
    const config = require("./configs/db.config").db;
    //Test for creating new model in database
    const User = require('./models/user_test.model');
    const mongoose = require('mongoose');

mongoose.connect('your_connection_string', { useNewUrlParser: true, useUnifiedTopology: true });

const createInitialUsers = async () => {
  try {
    await User.deleteMany({}); // Caution: This line deletes all existing users!

    const users = [
      { username: 'user1', email: 'user1@example.com', password: 'password123' },
      { username: 'user2', email: 'user2@example.com', password: 'password123' }
    ];

    await User.insertMany(users);
    console.log('Initial users created');
  } catch (error) {
    console.error('Error initializing the database:', error);
  } finally {
    mongoose.disconnect();
  }
};

createInitialUsers();
    //init middleware
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(morgan("combined"))
    app.use(helmet())
    app.use(compression())

    //init db
    config.connect();

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