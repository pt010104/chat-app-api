'use strict'
const {model, Schema, Types} = require('mongoose')

const DOCUMENT_NAME = 'User'

const user = new Schema({
  name: {
    type: String,
    trim: true,
    maxLength: 50
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
    trim: true
  },
  phone: {
    type: String,
    minLength: 10,
    trim: true
  },
  gender:{
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
  avatar: String,
  thumb_avatar: String
}, {
  timestamps: true,
})

module.exports = model(DOCUMENT_NAME, user)