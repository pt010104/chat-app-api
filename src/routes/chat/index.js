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
route.post('/remove-users/:room_id', asyncHandler(chatController.removeUsersFromRoom));
route.post('/leave/:room_id', asyncHandler(chatController.leaveRoom));
route.get('/list-rooms', asyncHandler(chatController.listRooms));
module.exports = route;
