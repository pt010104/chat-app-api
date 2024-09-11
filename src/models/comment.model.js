'use strict'
const {model, Schema, Types} = require('mongoose')

const DOCUMENT_NAME = 'comment'
const COLLECTION_NAME = 'comments'

const chatSchema = new Schema({
    user_id: {
        type: Types.ObjectId,
        required: true,
        ref: 'User'
    },
    comment: {
        type: String,
        required: true
    },
    room_id: {
        type: Types.ObjectId,
        required: true,
        ref: 'Room'
    },
    post_id: {
        type: Types.ObjectId,
        required: true,
        ref: 'Message'
    },
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

module.exports = model(DOCUMENT_NAME, chatSchema)