const express = require('express');
const route = express.Router();
const chatController = require('../../controllers/chat.controller');
const { authentication } = require('../../auth/authUtils');
const { asyncHandler } = require('../../helpers/asyncHandler');

route.use(authentication);
route.post('/create-room', asyncHandler(chatController.createRoom));

module.exports = route;
