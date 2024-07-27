'use strict'

const {model, Schema, Types} = require('mongoose')

const DOCUMENT_NAME = 'keytoken'

const keyToken = new Schema({
    user_id: {
        type: Types.ObjectId,
        required: true,
        ref: 'User'
    },
    public_key: {
        type: String,
        required: true,
        trim: true
    },  
    private_key: {
        type: String,
        required: true,
        trim: true
    },
    refresh_token: {
        type: Array,
        default: []
    }
}, {
  timestamps: true,
})

module.exports = model(DOCUMENT_NAME, keyToken)