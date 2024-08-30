'use strict'
const {model, Schema, Types} = require('mongoose')

const DOCUMENT_NAME = 'roomE2EE'
const COLLECTION_NAME = 'roomsE2EE'

const roomE2EESchema = new Schema({
    user_ids: {
        type: [Types.ObjectId],
        required: true,
    },
    publicKey1: {
        type: String
    },
    publicKey2: {
        type: String
    }
    
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

module.exports = model(DOCUMENT_NAME, roomE2EESchema)