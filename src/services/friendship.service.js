'use strict'
const { BadRequestError, NotFoundError } = require('../core/error.response')
const UserModel = require('../models/user.model')
const FriendShipModel = require('../models/friendship.model')
const UserProfile = require('./profile.service')
const RedisService = require("./redis.service")

class FriendShip {

    static listFriends = async (user_id, limit, offset) => {

        const key = `listFriends:${user_id}`
        const cache = await RedisService.get(key)
        if (cache) {
            return cache
        }
        const listFriends = await FriendShipModel.find({
            $or: [
                { user_id_send: user_id, status: "accepted" },
                { user_id_receive: user_id, status: "accepted" }
            ]
        })
            .skip(offset)
            .limit(limit)
            .lean();
        if (listFriends.length === 0) {
            return;
        }
        const results = [];
        for (let friend of listFriends) {
            try {
                let user_id_friend = user_id === friend.user_id_send ? friend.user_id_receive : friend.user_id_send
                const user_info = await UserProfile.infoProfile(user_id_friend)

                results.push({
                    user_name: user_info.user.name,
                    avatar: user_info.user.avatar,
                })
            } catch (error) {
                throw new NotFoundError("User does not exist")
            }
        }
        await RedisService.set(key, results);
        return results;
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
                    request_id: request._id,
                    user_id_send: user_send_info.user._id,
                    user_name_send: user_send_info.user.name,
                    avatar: user_send_info.user.avatar,
                    created_at: request.createdAt
                })
            } catch (error) {
               throw new NotFoundError("User send does not exist")
            }
        }

        return results
    }

    static sendFriendRequest = async (user_id, user_id_receive) => {

        const check_user_receive = await UserModel.findOne({
            _id: user_id_receive
        }).lean()
        if (!check_user_receive) {
            throw new NotFoundError("User receive does not exist")
        }

        const check_request = await FriendShipModel.findOne({
            user_id_send: user_id,
            user_id_receive: user_id_receive
        }).lean()
        if (check_request) {
            throw new BadRequestError("Friend request already exists")
        }
        const sendRequest = await FriendShipModel.create({
            user_id_send: user_id,
            user_id_receive: user_id_receive,
            status: "pending",
            action_user_id: user_id
        })

        return {
            sendRequest
        }
    }

    static acceptFriendRequest = async (user_id, request_id) => {

        const acceptRequest = await FriendShipModel.findOneAndUpdate({
            _id: request_id,
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

    static cancelFriendRequest = async (user_id, request_id) => {
        const cancelRequest = await FriendShipModel.findOneAndDelete({
            user_id_send: user_id,
            _id: request_id,
            status: "pending"
        }).lean()

        if (!cancelRequest) {
            throw new NotFoundError("Friend request does not exist")
        }

        return {
            cancelRequest
        }
    }
    static searchFriend = async (user_id, keyword) => {
        //i want it search by name || email || phone. Create index for name and use regex. Dont show block user
        const key = `searchFriend:${user_id}`
        const cache = await RedisService.get(key)
        if (cache) {
            return cache
        }

        const ListUser = await UserModel.find({
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
                { phone: { $regex: keyword, $options: 'i' } }
            ],
            _id: { $ne: user_id }
        }).lean()
        if (ListUser.length === 0) {
            throw new NotFoundError("User does not exist")
        }
        const results = [];
        for (let user of ListUser) {
            try {
                const user_info = await UserProfile.infoProfile(user._id)
                results.push({
                    user_name: user_info.user.name,
                    avatar: user_info.user.avatar,
                })
            } catch (error) {
                throw new NotFoundError("User does not exist")
            }
        }
        return results
    }
}

module.exports = FriendShip