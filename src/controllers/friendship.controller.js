'use strict'
const { BadRequestError } = require('../core/error.response')
const { SuccessResponse } = require('../core/success.response')
const FriendShip = require('../services/friendship.service')

const Joi = require("joi");

class FriendshipController {

    // v1/api/friends/list/all
    listFriends = async(req, res, next) => {        
       try {
        const user_id = req.user.userId;

        const friendsList = await FriendShip.listFriends(user_id);

        new SuccessResponse({
            message: "List friends",
            metadata: friendsList
        }).send(res);
    } catch (error) {
        next(error);  // Passes the error to the next middleware
    }
    }

    // v1/api/friends/list/requests
    listRequestsFriends = async(req, res, next) =>  {
        const user_id = req.user.userId
        new SuccessResponse({
            message: "List friend requests",
            metadata: await FriendShip.listRequestsFriends(user_id)
        }).send(res)
    }

    // v1/api/friends/send-request
    sendFriendRequest = async(req, res, next) =>  {
         
        const friendValidate = Joi.object({
            user_id_receive: Joi.string().required()
        });

        const { error } = friendValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        const user_id = req.user.userId
        const { user_id_receive } = req.body
        new SuccessResponse({
            message: "Friend request sent",
            metadata: await FriendShip.sendFriendRequest(user_id, user_id_receive)
        }).send(res)
    }

    // v1/api/friends/accept
    acceptFriendRequest = async(req, res, next) =>  {

        const friendValidate = Joi.object({
            request_id: Joi.string().required()
        });

        const { error } = friendValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        const user_id = req.user.userId
        const { request_id } = req.body
        new SuccessResponse({
            message: "Friend request accepted",
            metadata: await FriendShip.acceptFriendRequest(user_id, request_id)
        }).send(res)
    }

    // v1/api/friends/cancel-request
    cancelFriendRequest = async(req, res, next) => {

        const friendValidate = Joi.object({
            request_id: Joi.string().required()
        });

        const { error } = friendValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        const user_id = req.user.userId
        const { request_id } = req.body
        new SuccessResponse({
            message: "Friend request canceled",
            metadata: await FriendShip.cancelFriendRequest(user_id, request_id)
        }).send(res)

    }

    // v1/api/friends/remove
    async removeFriend(req, res) {
        const friendValidate = Joi.object({
            friend_id: Joi.string().required()
        });

        const { error } = friendValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        const user_id = req.user.userId
        const { friend_id } = req.body
        new SuccessResponse({
            message: "Friend removed",
            metadata: await FriendShip.removeFriend(user_id, friend_id)
        }).send(res)
    }
    
    // v1/api/friends/search-friends
    async searchFriend(req, res) {     
        const friendValidate = Joi.object({
            filter: Joi.string().required()
        });

        const { error } = friendValidate.validate(req.query);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        const user_id = req.user.userId
        const { filter } = req.query
        new SuccessResponse({
            message: "Search friend",
            metadata: await FriendShip.searchFriend(user_id, filter)
        }).send(res)
        
    }
    async denyFriendRequest(req, res) {
        const friendValidate = Joi.object({
            request_id: Joi.string().required()
        });

        const { error } = friendValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        const user_id = req.user.userId
        const { request_id } = req.body
        new SuccessResponse({
            message: "Friend request denied",
            metadata: await FriendShip.denyFriendRequest(user_id, request_id)
        }).send(res)
    }

    async listFriendsNotInRoomChat(req, res, next) {
        const listFriendsNotInRoomChatValidate = Joi.object({
            room_id: Joi.string().required()
        });

        const { error } = listFriendsNotInRoomChatValidate.validate(req.params);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        const room_id = req.params.room_id 
        const user_id = req.user.userId

        new SuccessResponse({
            message: "List friends not in room",
            metadata: await FriendShip.listFriendsNotInRoomChat(user_id, room_id)
        }).send(res)
    }

}

module.exports = new FriendshipController()