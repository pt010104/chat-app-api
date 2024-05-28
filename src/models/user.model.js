'use strict'

const {model, Schema, Types} = require('mongoose')

const DOCUMENT_NAME = 'user'
const COLLECTION_NAME = 'users'

const userSchema = new Schema({
  name: {
    type: String,
    trim: true,
    maxLength: 50
  },
  email: {
    type: String,
    trim: true,
    unique: true
  },
  password: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  verify: {
    type: Boolean,
    default: false
  },
  roles: {
    type: [String],
    default: []
  },
}, {
  timestamps: true,
  collection: COLLECTION_NAME
})

module.exports = model(DOCUMENT_NAME, userSchema)