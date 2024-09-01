'use strict'
const {model, Schema, Types} = require('mongoose')

const DOCUMENT_NAME = 'roomE2EE'
const COLLECTION_NAME = 'roomsE2EE'

const roomE2EESchema = new Schema({
    name: {
        type: String,
        required: true
    },
    user_ids: {
        type: [Types.ObjectId],
        required: true,
    },
    publicKey1: {
        type: String
    },
    publicKey2: {
        type: String
    },
    name_remove_sign: {
        type: String,
    },
    auto_name: {
        type: Boolean,
        default: false
    },
    avt_url: {
        type: String,
        default: ''
    },
    user_ids: {
        type: [Types.ObjectId],
        required: true,
    },
    created_by: {
        type: Types.ObjectId,
        required: true
    },
    is_group: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

module.exports = model(DOCUMENT_NAME, roomE2EESchema)