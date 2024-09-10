const RedisService = require("../../services/redis.service");
const CommentModel = require("../comment.model");
const { findUserById } = require("./user.repository");

class CommentRepository {
    async transform(commentData) {
        const transformed_msg = {
            id: commentData._id,
            user_id: commentData.user_id,
            comment: commentData.comment,
            post_id: commentData.post_id,
            room_id: commentData.room_id,
            created_at: commentData.createdAt
        }

        const user_info = await findUserById(commentData.user_id);
        if (!user_info) {
            console.log("Error at CommentRepository.transform.findUserById");
            return null;
        }

        transformed_msg.user_name = user_info.name;
        transformed_msg.user_avatar = user_info.avatar;

        return transformed_msg;
    }

    async createComment(params) {
        const commentCreated = await CommentModel.create({
            user_id: params.userId,
            comment: params.comment,
            post_id: params.postId,
            room_id: params.room_id
        });

        const type = "comment:post_id";

        RedisService.delete(`${type}:${params.postId}`);

        return commentCreated;
    }

    async listComment(postId) {
        const type = "comment:post_id";

        const listCache = await RedisService.getMessages(type, postId);
        if (listCache && listCache.length > 0) {
            return listCache;
        }

        const comments = await CommentModel.find({ post_id: postId }).lean();
        if (!comments) {
            console.log("Error at CommentRepository.listComment.find");
            return null;
        }

        await Promise.all(comments.map(async (comment) => {
            await RedisService.storeOrUpdateMessage(type, postId, comment);
        }));

        return comments;
    }
}

module.exports = new CommentRepository();