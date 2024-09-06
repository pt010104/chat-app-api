const express = require('express');
const route = express.Router();
const privateRoomController = require('../../controllers/privateRoom.controller');
const { authentication } = require('../../auth/authUtils');
const { asyncHandler } = require('../../helpers/asyncHandler');

route.use(authentication);

route.post('/create', asyncHandler(privateRoomController.createRoom));
route.get('/new-messages', asyncHandler(privateRoomController.getNewMessagesEachRoom));
route.get('/messages/:room_id', asyncHandler(privateRoomController.getMessagesInRoom));
route.get('/:room_id', asyncHandler(privateRoomController.detailRoom));
route.patch('/:room_id', asyncHandler(privateRoomController.updateRoom));
route.post('/get-And-Set-Keys', asyncHandler(privateRoomController.getAndSetKey));
route.post('/end-Session/:room_id', asyncHandler(privateRoomController.endSession));
module.exports = route;
