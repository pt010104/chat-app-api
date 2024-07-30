'use strict'
const { BadRequestError, NotFoundError } = require('../core/error.response')
const UserModel = require('../models/user.model')
const FriendShipModel = require('../models/friendship.model')
const UserProfile = require('./profile.service')
const RedisService = require("./redis.service")
const UserRepo = require('../models/repository/user.repository')
const { crossOriginResourcePolicy } = require('helmet')
class FriendShip {

    static async listFriends(user_id, limit, page) {
        const offset = (page - 1) * limit;
        const key = `listFriends:${user_id}`;
        const cache = await RedisService.storeOrUpdateMessage('get', key, 'null');
        if (cache) {
            console.log(`Cache hit for key: ${key}`);
            return cache;
        }

        if (cache && cache !== 'null') {
            console.log(`Cache hit for key: ${key}`);
            const cachedFriends = JSON.parse(cache);
            const paginatedFriends = cachedFriends.slice(offset, offset + limit);
            return paginatedFriends;
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

        console.log(`Friends found: ${listFriends.length}`);
        if (listFriends.length === 0) {
            throw new NotFoundError("User does not exist");
        }

        const results = [];
        for (let friend of listFriends) {
            let user_id_friend;
            try {
                user_id_friend = user_id === friend.user_id_send ? friend.user_id_send : friend.user_id_receive
                const user_info = await UserRepo.transformData.transformUser(user_id_friend);
                results.push({
                    user_info
                })
            } catch (error) {
                throw new NotFoundError(`User with ID ${user_id_friend} does not exist`);
            }
        }

        await RedisService.set(key, JSON.stringify(results));

        const paginatedResults = results.slice(offset, offset + limit);
        return paginatedResults;
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

        const paginatedResults = results.slice(offset, offset + limit);
        return paginatedResults;
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

    static async searchFriend(user_id, query) {
        const key = `listFriends:${user_id}`;
        const cache = await RedisService.get(key);

        if (!cache || cache === 'null') {
            throw new NotFoundError("No cached friends list found");
        }

        const cachedFriends = JSON.parse(cache);
        const regex = new RegExp(query, 'i'); // case-insensitive regex for search

        const filteredFriends = cachedFriends.filter(friend =>
            regex.test(friend.user_info.user_name) ||
            regex.test(friend.user_info.email) ||
            regex.test(friend.user_info.phone)
        );

        if (filteredFriends.length === 0) {
            throw new NotFoundError("No friends found matching the search criteria");
        }

        return filteredFriends;
    }


    // static async searchFriend(user_id, keyword, limit, offset) {
    //     console.log(`Searching friends for user ID: ${user_id} with keyword: ${keyword}`);
    //     const key = `searchFriend:${user_id}:${keyword}:${limit}:${offset}`;
    //     console.log(`Key: ${key}`);
    //     const cache = await RedisService.get(key);
    //     if (cache) {
    //         console.log(`Cache hit for key: ${key}`);
    //         return cache;
    //     }
    //     console.log(`Cache miss for key: ${key}`);

    //     const ListUser = await UserRepo.transformData.findFriend(user_id, keyword);
    //     if (ListUser.length === 0) {
    //         throw new NotFoundError("User does not exist")
    //     }
    //     const results = [];
    //     console.log(`Users found: ${ListUser.length}`);
    //     for (let user of ListUser) {
    //         try {
    //             const user_info = await UserProfile.infoProfile(user._id)
    //             results.push({
    //                 user_name: user_info.user.name,
    //                 avatar: user_info.user.avatar,
    //             })
    //         } catch (error) {
    //             throw new NotFoundError("User does not exist")
    //         }
    //     }

    //     await RedisService.set(key, JSON.stringify(results));
    //     return results
    // }
}

module.exports = FriendShip