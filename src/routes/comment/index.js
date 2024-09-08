const express = require('express');
const route = express.Router();
const CommentController = require('../../controllers/comment.controller');
const { authentication } = require('../../auth/authUtils');
const { asyncHandler } = require('../../helpers/asyncHandler');

route.use(authentication);

route.post('/:postId', asyncHandler(CommentController.PostComment));
route.get('/:postId', asyncHandler(CommentController.ListComment));

module.exports = route;
