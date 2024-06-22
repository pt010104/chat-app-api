'use strict'
const { BadRequestError, NotFoundError} = require('../core/error.response')
const UserModel = require('../models/user.model')
const FriendShipModel = require('../models/friendship.model')
const UserProfile = require('./profile.service')

class FriendShip {

    static listFriends = async (user_id) => {
    }

    static listRequestsFriends = async (user_id) => {

        const listRequests = await FriendShipModel.find({
            user_id_receive: user_id,
            status: "pending"
        }).lean();
        if (listRequests.length === 0) {
            return;
        }

        const results = [];
        for (let request of listRequests) {
            try {
                const user_send_info = await UserProfile.infoProfile(request.user_id_send);
                results.push({
                    user_id_send: user_send_info.user._id,
                    user_name_send: user_send_info.user.name,
                    avatar: user_send_info.user.avatar,
                    created_at: request.createdAt
                })
            } catch(error) {
                console.error(error)
                continue;
            }  
        }
        
        return results
    }

    static sendFriendRequest = async (user_id, user_id_recieve) => {

        const check_user_recieve = await UserModel.findOne({
            _id: user_id_recieve
        }).lean()
        if (!check_user_recieve) {
            throw new NotFoundError("User recieve does not exist")
        }

        const check_request = await FriendShipModel.findOne({
            user_id_send: user_id,
            user_id_receive: user_id_recieve
        }).lean()
        if (check_request) {
            throw new BadRequestError("Friend request already exists")
        }
        const sendRequest = await FriendShipModel.create({
            user_id_send: user_id,
            user_id_receive: user_id_recieve,
            status: "pending",
            action_user_id: user_id
        })

        return {
            sendRequest
        }
    }

    static acceptFriendRequest = async (user_id, user_id_send) => {

        const acceptRequest = await FriendShipModel.findOneAndUpdate({
            user_id_send: user_id_send,
            user_id_receive: user_id,
            status: "pending"
        }, {
            status: "accepted",
        }, {
            new: true
        }).lean()

        if (!acceptRequest) {
            throw new NotFoundError("Friend request does not exist")
        }

        return {
            acceptRequest
        }

    }

    static cancelFriendRequest = async (user_id, user_id_recieve) => {
        const cancelRequest = await FriendShipModel.findOneAndDelete({
            user_id_send: user_id,
            user_id_receive: user_id_recieve,
            status: "pending"
        }).lean()

        if (!cancelRequest) {
            throw new NotFoundError("Friend request does not exist")
        }

        return {
            cancelRequest
        }
    }
}

module.exports = FriendShip