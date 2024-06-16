'use strict'

const {model, Schema} = require('mongoose')
const { collection } = require('./user.model')

const DOCUMENT_NAME = 'template'
const COLLECTION_NAME = 'templates'
const templateSchema = new Schema({
    tem_id: {type: Number, required: true},
    name: {type: String, required: true},
    status: {type: String, default: 'active'},
    html: {type: String, required: true},
}, {
    timestamps: true,
    collection: COLLECTION_NAME
})

module.exports = model(DOCUMENT_NAME, templateSchema)