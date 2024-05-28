const { default: mongoose } = require("mongoose")
require('dotenv').config(); 

const connectString = `mongodb+srv://${process.env.DEV_DB_USER}:${process.env.DEV_DB_PASSWORD}@cluster0.ncw7dc4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

class Database {
    constructor() {
        this.connect()
    }

    connect (type = 'mongodb'){
        mongoose.set('debug', true)
        mongoose.set('debug', {
            color:true
        })
        mongoose.connect (connectString)
            .then(() => console.log('MongoDB connected'))
            .catch(err => console.error('MongoDB connection error:', err))
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new Database()
        }

        return this.instance
    }
}

const instanceMongodb = Database.getInstance()
module.exports = instanceMongodb