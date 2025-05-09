'use strict'

const {model, Schema} = require('mongoose')
const { collection } = require('./user.model')

const DOCUMENT_NAME = 'otp_log'
const COLLECTION_NAME = 'otp_logs'
const otpSchema = new Schema({
    otp: {type: String, required: true},
    email: {type: String, required: true},
    type: {type: String, defaultL: 'new-user', enum: ['new-user', 'reset-password', 'change-password']},
    expire_at: {type: Date, default: Date.now, expires: 120}
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

module.exports = model(DOCUMENT_NAME, otpSchema)