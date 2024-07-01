'use strict'
const {model, Schema, Types} = require('mongoose')

const DOCUMENT_NAME = 'room'
const COLLECTION_NAME = 'rooms'

const roomSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    avt_link: {
        type: String,
        default: ''
    },
    users: {
        type: [Types.ObjectId],
        required: true,
    },
    isGroup: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

module.exports = model(DOCUMENT_NAME, roomSchema)