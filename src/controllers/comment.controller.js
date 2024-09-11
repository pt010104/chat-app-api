'use strict';

const { BadRequestError } = require("../core/error.response");
const { SuccessResponse } = require("../core/success.response");
const CommentService = require("../services/comments.service");
const Joi = require("joi");

class CommentController {
    PostComment = async (req, res) => {
        const commentValidate = Joi.object({
            room_id: Joi.string().required(),
            comment: Joi.string().required(),
        });

        const { error } = commentValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message,
            });
        }

        const { room_id, comment } = req.body;
        const postId = req.params.postId
        const userId = req.user.userId;

        new SuccessResponse({
            message: "Comment posted successfully",
            metadata: await CommentService.PostComment({ room_id, postId, comment, userId })
        }).send(res);
    }

    ListComment = async (req, res) => {
        const commentValidate = Joi.object({
            postId: Joi.string().required(),
        });

        const { error } = commentValidate.validate(req.params);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message,
            });
        }

        const { postId } = req.params;

        new SuccessResponse({
            message: "Comment listed successfully",
            metadata: await CommentService.ListComment(postId)
        }).send(res);
    }
}

module.exports = new CommentController();