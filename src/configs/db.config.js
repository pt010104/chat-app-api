require("dotenv").config();
const mongoose = require("mongoose");

const dev = {
    app: {
        port: process.env.DEV_PORT
    },
    db: {
        uri: `mongodb+srv://${process.env.DEV_DB_USER}:${process.env.DEV_DB_PASSWORD}@cluster0.ncw7dc4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`,
        connect() {
            mongoose.connect(this.uri)
                .then(() => console.log('MongoDB connected'))
                .catch(err => console.error('MongoDB connection error:', err));
        }
    }
};

const config = { dev };
const envMode = process.env.NODE_ENV || "dev";

module.exports = config[envMode];
