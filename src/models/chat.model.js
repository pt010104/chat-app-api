'use strict'
const {model, Schema, Types} = require('mongoose')

const DOCUMENT_NAME = 'chat'
const COLLECTION_NAME = 'chats'

const chatSchema = new Schema({
    user_id: {
        type: Types.ObjectId,
        required: true,
        ref: 'User'
    },
    message: {
        type: String,
        required: true
    },
    status: {type: String, default: 'unread', enum: ['unread', 'read', 'sent', 'deleted']},
    room_id: {
        type: Types.ObjectId,
        required: true,
        ref: 'Room'
    },
    image_url: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

module.exports = model(DOCUMENT_NAME, chatSchema)