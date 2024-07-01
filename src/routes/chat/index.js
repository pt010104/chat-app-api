const express = require('express');
const route = express.Router();
const chatController = require('../../controllers/chat.controller');
const { authentication } = require('../../auth/authUtils');

route.use(authentication);
route.post('/sendmessage', chatController.sendMessage);
route.post('/createroom', chatController.createRoom);

module.exports = route;
