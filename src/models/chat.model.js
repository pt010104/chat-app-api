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
    status: {type: String, default: 'unread', enum: ['unread', 'read', 'sent']},
    is_Edited: {type: Boolean, default: false},
    room_id: {
        type: Types.ObjectId,
        required: true,
        ref: 'Room'
    },
    deleted_at: {type: Date, default: null},
    image_url: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

chatSchema.pre('find', function() {
    this.where({ deleted_at: null });
});

chatSchema.pre('findOne', function() {
    this.where({ deleted_at: null });
});

chatSchema.pre('findOneAndUpdate', function() {
    this.where({ deleted_at: null });
});

chatSchema.pre('countDocuments', function() {
    this.where({ deleted_at: null });
});
module.exports = model(DOCUMENT_NAME, chatSchema)