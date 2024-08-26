'use strict'
const { BadRequestError, NotFoundError } = require('../core/error.response')
const UserModel = require('../models/user.model')
const FriendShipModel = require('../models/friendship.model')
const UserProfile = require('./profile.service')
const RedisService = require("./redis.service")
const FriendRepo = require('../models/repository/friend.repository')
const { findUserById } = require('../models/repository/user.repository')
const roomRepository = require('../models/repository/room.repository')

class FriendShip {
    static async findFriends(user_id) {
        const key = `listFriends:${user_id}`;
        let friends = await RedisService.get(key);

        if (!friends) {
            friends = await FriendRepo.listFriends(user_id);
            if (friends) {
                await RedisService.set(key, JSON.stringify(friends), 3600);
            }
        } else {
            friends = JSON.parse(friends);
        }

        return friends;
    }

    static async listFriends(user_id, limit, page) {
        const offset = (page - 1) * limit;
        const friends = await this.findFriends(user_id);

        const paginatedFriends = friends.slice(offset, offset + limit);

        const friendPromises = paginatedFriends.map(async (friend) => {
            const friend_id = user_id == friend.user_id_send ? friend.user_id_receive : friend.user_id_send;
            try {
                const friend_info = await findUserById(friend_id);
                return FriendRepo.transformFriend(friend_info);
            } catch (error) {
                console.error(`Error processing friend ${friend_id}:`, error);
                return null;
            }
        });

        const results = await Promise.all(friendPromises);
        return results.filter(Boolean);
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
                const user_send_info = await findUserById(request.user_id_send);
                results.push({
                    request_id: request._id,
                    user_id_send: user_send_info._id,
                    user_name_send: user_send_info.name,
                    avatar: user_send_info.avatar,
                    created_at: request.createdAt
                })
            } catch (error) {
                console.log(error);
            }
        }

        return results;
    }

    static sendFriendRequest = async (user_id, user_id_receive) => {

        const check_user_receive = await UserModel.findOne({
            _id: user_id_receive
        }).lean()
        if (!check_user_receive) {
            throw new NotFoundError("User receive does not exist")
        }

        const check_request = await FriendShipModel.findOne({
            $or: [
                { user_id_send: user_id, user_id_receive: user_id_receive },
                { user_id_send: user_id_receive, user_id_receive: user_id }
            ]
        }).lean();
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
            user_id_receive: user_id,
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

    static async searchFriend(user_id, filter) {
        let friends = await this.findFriends(user_id);
    
        const regex = new RegExp(filter, 'i');
        const transformPromises = friends.map(async (friend) => {
            const friend_id = user_id == friend.user_id_send ? friend.user_id_receive : friend.user_id_send;
            try {
                const friend_info = await findUserById(friend_id)
                const transformed_friend = await FriendRepo.transformFriend(friend_info);
                return transformed_friend;
            } catch (error) {
                console.error(`Error transforming friend ${friend_id}:`, error);
                return null;
            }
        });

        const transformedFriends = (await Promise.all(transformPromises)).filter(Boolean);
    
        return transformedFriends.filter(friend => 
            regex.test(friend.user_name) ||
            friend.user_email === filter ||
            friend.user_phone === filter
        );
    }

    static removeFriend = async (user_id, friend_id) => {
        const friend = await FriendShipModel.findOneAndDelete({
            $or: [
                { user_id_send: user_id, user_id_receive: friend_id },
                { user_id_send: friend_id, user_id_receive: user_id }
            ],
            status: "accepted"
        }).lean()
        
        if (!friend) {
            throw new NotFoundError("Friend does not exist")
        }
        const key = `listFriends:${user_id}`;
        await RedisService.delete(key);
        return friend
    }

    static async denyFriendRequest(user_id, request_id) {
        const denyRequest = await FriendShipModel.findOneAndUpdate({
            _id: request_id,
            user_id_receive: user_id,
            status: "pending"
        }, {
            status: "rejected",
        }, {
            new: true
        }).lean()

        if (!denyRequest) {
            throw new NotFoundError("Friend request does not exist")
        }

    }

    static async checkIsFriend(user_id, friend_id) {
        const friends = await this.findFriends(user_id);

        if (friends.length === 0) {
            return false;
        }

        friends.forEach(friend => {
            if (friend._id == friend_id) {
                return true
            }
        })

        return false
    }

    static async listFriendsNotInRoomChat(userID, room_id) {
        const friends = await this.findFriends(userID);

        const friends_ids = friends.map(friend => {
            return userID == friend.user_id_send ? friend.user_id_receive : friend.user_id_send;
        });

        console.log(friends_ids)

        const room = await roomRepository.getRoomByID(room_id)
        const room_user_ids = room.user_ids

        console.log(room_user_ids)

        const friends_not_in_room = friends_ids.filter(friend_id => !room_user_ids.includes(friend_id));

        const promises = friends_not_in_room.map(async (friend_id) => {
            try {
                const friend_info = await findUserById(friend_id);
                return FriendRepo.transformFriend(friend_info);
            } catch (error) {
                console.error(`Error processing friend ${friend_id}:`, error);
                return null;
            }
        });

        const results = await Promise.all(promises);
        return results.filter(Boolean);
    }
}
module.exports = FriendShip