const express = require('express');
const route = express.Router();
const E2EEController = require('../../controllers/E2EE.controller');
const { authentication } = require('../../auth/authUtils');
const { asyncHandler } = require('../../helpers/asyncHandler');

route.use(authentication);

route.post('/create', asyncHandler(E2EEController.createRoom));
route.get('/new-messages', asyncHandler(E2EEController.getNewMessagesEachRoom));
route.get('/messages/:room_id', asyncHandler(E2EEController.getMessagesInRoom));
route.post('/add-users/:room_id', asyncHandler(E2EEController.addUsersToRoom));
route.get('/:room_id', asyncHandler(E2EEController.detailRoom));
route.patch('/:room_id', asyncHandler(E2EEController.updateRoom));
route.post('/search', asyncHandler(E2EEController.searchRoom));
route.post('/create-E2EE', asyncHandler(E2EEController.createE2EE));
route.post('/end-Session-E2EE/:room_id', asyncHandler(E2EEController.endE2EE));
module.exports = route;
