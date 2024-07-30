'use strict'

const { model, Schema, Types } = require('mongoose')

const DOCUMENT_NAME = 'friendship'
const COLLECTION_NAME = 'friendships'

const friendshipSchema = new Schema({
    user_id_send: {
        type: Types.ObjectId,
        required: true,
        ref: 'User'
    },
    user_id_receive: {
        type: Types.ObjectId,
        required: true,
        ref: 'User'
    },
    status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'rejected'] },
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

module.exports = model(DOCUMENT_NAME, friendshipSchema)