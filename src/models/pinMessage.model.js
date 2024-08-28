'use strict'
const {model, Schema, Types} = require('mongoose')

const DOCUMENT_NAME = 'pinMessage'
const COLLECTION_NAME = 'pinMessages'

const pinMessageSchema = new Schema({
    message_id: {
        type: [Types.ObjectId],
        required: true,
        ref: 'chats'
    },

    room_id: {
        type: Types.ObjectId,
        required: true,
        ref: 'Room'
    },
    
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

module.exports = model(DOCUMENT_NAME, pinMessageSchema)