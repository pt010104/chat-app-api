'use strict'
const {model, Schema, Types} = require('mongoose')

const DOCUMENT_NAME = 'room'
const COLLECTION_NAME = 'rooms'

const roomSchema = new Schema({
    name: {
        type: String,
        required: true
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
    },
    type_group:{
        type: String,
        default: '',
    },
    public_Key_1: {
        type: String,
        default: ''
    },
    public_Key_2: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

module.exports = model(DOCUMENT_NAME, roomSchema)