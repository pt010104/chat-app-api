const express = require('express');
const route = express.Router();
const chatController = require('../../controllers/chat.controller');
const { authentication } = require('../../auth/authUtils');
const { asyncHandler } = require('../../helpers/asyncHandler');

route.use(authentication);

route.post('/create', asyncHandler(chatController.createRoom));
route.get('/new-messages', asyncHandler(chatController.getNewMessagesEachRoom));
route.get('/messages/:room_id', asyncHandler(chatController.getMessagesInRoom));
route.post('/delete-messages/:room_id', asyncHandler(chatController.deleteMessagesInRoom));
route.post('/edit-message/:room_id', asyncHandler(chatController.editMessageInRoom));
route.post('/pin-message/:room_id', asyncHandler(chatController.pinMessageInRoom));
route.post('/unpin-message/:room_id', asyncHandler(chatController.unpinMessageInRoom));
route.get('/list-pinned-messages/:room_id', asyncHandler(chatController.listPinnedMessages));
route.post('/add-users/:room_id', asyncHandler(chatController.addUsersToRoom));
route.get('/:room_id', asyncHandler(chatController.detailRoom));
route.patch('/:room_id', asyncHandler(chatController.updateRoom));

module.exports = route;
