'use strict'

const { NotFoundError } = require("../core/error.response")
const RoomRepository = require("../models/repository/room.repository")
const RabbitMQService = require("./rabbitmq.service")
const { BadRequestError } = require("../core/error.response")
const RedisService = require("./redis.service")
const CommentRepository = require("../models/repository/comment.repository")
const ChatRepository = require("../models/repository/chat.repository")
const { findUserById } = require("../models/repository/user.repository")
const { removeVietNamese } = require("../utils")

class CommentService {
    static async PostComment(params) {
        const postId = params.postId;
        const postFound = await ChatRepository.getMessageById(postId);
        if (!postFound) {
            throw new NotFoundError("Post not found");
        }

        const comment = await CommentRepository.createComment(params);

        const transformedComment = await CommentRepository.transform(comment);

        return transformedComment;
    }

    static async ListComment(postId) {
        const comments = await CommentRepository.listComment(postId);
        if (!comments || comments.length === 0) {
            console.log("Warn at CommentService.CommentRepository.ListComment");
            return [];
        }   

        let transformedComments = await Promise.all(
            comments.map(comment => CommentRepository.transform(comment))
        );

        transformedComments = transformedComments.filter(comment => comment !== null);
        console.log(transformedComments)
        
        return transformedComments;
    }
}

module.exports = CommentService