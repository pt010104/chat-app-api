const express = require('express');
const route = express.Router();
const chatController = require('../../controllers/chat.controller');
const { authentication } = require('../../auth/authUtils');
const { asyncHandler } = require('../../helpers/asyncHandler');

route.use(authentication);

route.post('/create', asyncHandler(chatController.createRoom));
route.get('/new-messages', asyncHandler(chatController.getNewMessagesEachRoom));
route.get('/messages/:room_id', asyncHandler(chatController.getMessagesInRoom));
route.post('/add-users/:room_id', asyncHandler(chatController.addUsersToRoom));

module.exports = route;