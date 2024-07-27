'use strict'
const { BadRequestError } = require('../core/error.response')
const { SuccessResponse } = require('../core/success.response')
const FriendShip = require('../services/friendship.service')
const Joi = require("joi");

class FriendshipController {

    // v1/api/friends/list/all
    listFriends = async(req, res, next) => {
        //use redis for caching
        

        const user_id = req.user.userId
        new SuccessResponse({
            message: "List friends",
            metadata: await FriendShip.listFriends(user_id)
        }).send(res)
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
        const { user_id_recieve } = req.body
        new SuccessResponse({
            message: "Friend request sent",
            metadata: await FriendShip.sendFriendRequest(user_id, user_id_recieve)
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

    // v1/api/friends/reject-request
    async rejectFriendRequest(req, res) {
    }

    // v1/api/friends/remove
    async removeFriend(req, res) {
    }
    
    // v1/api/friends/search-friends
    async searchFriend(req, res) {
        const friendValidate = Joi.object({
            search: Joi.string().required()
        });

        const { error } = friendValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
              message: error.details[0].message,
            });
        }

        const user_id = req.user.userId
        const { search } = req.body
        new SuccessResponse({
            message: "Search friend",
            metadata: await FriendShip.searchFriend(user_id, search)
        }).send(res)
        
    }
}

module.exports = new FriendshipController()