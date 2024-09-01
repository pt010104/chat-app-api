const express = require('express');
const route = express.Router();
const roomE2EEController = require('../../controllers/roomE2EE.controller');
const { authentication } = require('../../auth/authUtils');
const { asyncHandler } = require('../../helpers/asyncHandler');

route.use(authentication);

route.post('/create', asyncHandler(roomE2EEController.createRoom));
route.get('/new-messages', asyncHandler(roomE2EEController.getNewMessagesEachRoom));
route.get('/messages/:room_id', asyncHandler(roomE2EEController.getMessagesInRoom));
route.post('/add-users/:room_id', asyncHandler(roomE2EEController.addUsersToRoom));
route.get('/:room_id', asyncHandler(roomE2EEController.detailRoom));
route.patch('/:room_id', asyncHandler(roomE2EEController.updateRoom));
route.post('/search', asyncHandler(roomE2EEController.searchRoom));
route.post('/get-And-Set-Keys', asyncHandler(roomE2EEController.getAndSetKey));
route.post('/create-E2EE', asyncHandler(roomE2EEController.createE2EE));
//route.post('/end-Session-E2EE/:room_id', asyncHandler(roomE2EEController.endE2EE));
module.exports = route;
