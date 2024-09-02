'use strict'
const { BadRequestError, NotFoundError } = require('../core/error.response')
const UserModel = require('../models/user.model')
const FriendShipModel = require('../models/friendship.model')
const UserProfile = require('./profile.service')
const RedisService = require("./redis.service")
const FriendRepo = require('../models/repository/friend.repository')
const { findUserById } = require('../models/repository/user.repository')
const roomRepository = require('../models/repository/room.repository')
const { removeVietNamese } = require('../utils')
const ChatService = require('./chat.service')

class FriendShip {
    static async findFriends(user_id) {
        const key = `listFriends:${user_id}`;
        let friends = await RedisService.get(key);

        if (!friends) {
            friends = await FriendRepo.listFriends(user_id);
            if (friends.length != 0) {
                await RedisService.set(key, JSON.stringify(friends), 3600);
            }
        } else {
            friends = JSON.parse(friends);
        }

        return friends;
    }

    static async listFriends(user_id) {
        const friends = await this.findFriends(user_id);
    
        const processedFriendIds = new Set();
        
        const uniqueFriends = friends.filter(friend => {
            friend.user_id_send = friend.user_id_send.toString();
            friend.user_id_receive = friend.user_id_receive.toString();
            const friend_id = user_id == friend.user_id_send ? friend.user_id_receive : friend.user_id_send;
            console.log(friend_id)
            if (processedFriendIds.has(friend_id)) {
                return false; 
            } else {
                processedFriendIds.add(friend_id);
                return true; 
            }
        });
    
        const friendPromises = uniqueFriends.map(async (friend) => {
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
    
    static async findRequestsFriends(user_id) {
        const key = `listRequestsFriend:${user_id}`;
        let requests = await RedisService.get(key);
        if (!requests) {
            requests = await FriendShipModel.find({
                user_id_receive: user_id,
                status: "pending"
            }).lean();
            if (requests) {
                await RedisService.set(key, JSON.stringify(requests), 3600);
            }
        } else {
            requests = JSON.parse(requests);
        }

        return requests;
    }

    static listRequestsFriends = async (user_id, limit, page) => {
        const list = await FriendShipModel.find({
            user_id_receive: user_id,
            status: "pending"
        }).lean();
        
        if (list.length === 0) {
            return;
        }
    
        const resultsPromises = list.map(async (request) => {
            try {
                const [user_send_info, mutual_friends] = await Promise.all([
                    findUserById(request.user_id_send),
                    this.countMutualFriends(user_id, request.user_id_send)
                ]);
    
                return {
                    request_id: request._id,
                    user_id_send: user_send_info._id,
                    user_name_send: user_send_info.name,
                    avatar: user_send_info.avatar,
                    mutual_friends, 
                    created_at: request.createdAt
                };
            } catch (error) {
                console.error(error);
                return null; 
            }
        });
    
        const results = await Promise.all(resultsPromises);
    
        return results.filter(result => result !== null);
    }

    static countMutualFriends = async (user_id, friend_id) => {
        const [friends, friend_friends] = await Promise.all([
            this.findFriends(user_id),
            this.findFriends(friend_id)
        ]);
    
        const mutualFriends = friends.filter(friend => {
            return friend_friends.some(friend_friend => {
                return (
                    (friend.user_id_send.toString() === friend_friend.user_id_send.toString() ||
                     friend.user_id_send.toString() === friend_friend.user_id_receive.toString()) ||
                    (friend.user_id_receive.toString() === friend_friend.user_id_send.toString() ||
                     friend.user_id_receive.toString() === friend_friend.user_id_receive.toString())
                );
            });
        });
    
        return mutualFriends.length;
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

    static acceptFriendRequest = async (user_id, request_id, user_target_id) => {
        let query;
        if (request_id) {
            query = { _id: request_id, user_id_receive: user_id, status: "pending" };
        } else if (user_target_id) {
            query = { user_id_send: user_target_id, user_id_receive: user_id, status: "pending" };
        } else {
            throw new Error("Either request_id or user_target_id must be provided");
        }
    
        const acceptRequest = await FriendShipModel.findOneAndUpdate(
            query,
            { status: "accepted" },
            { new: true }
        ).lean();
    
        if (!acceptRequest) {
            throw new NotFoundError("Friend request does not exist");
        }
    
        const createRoomParams = {
            user_ids: [acceptRequest.user_id_send.toString(), acceptRequest.user_id_receive.toString()],
            userId: user_id
        };

        console.log(createRoomParams)
    
        await ChatService.createRoom(createRoomParams);
    
        const key1 = `listFriends:${user_id}`;
        const key2 = `listFriends:${acceptRequest.user_id_send}`;
        await RedisService.delete(key1);
        await RedisService.delete(key2);
    
        return { acceptRequest };
    }
    
    static cancelFriendRequest = async (user_id, request_id, user_target_id) => {
        let query;
        if (request_id) {
            query = { _id: request_id, user_id_send: user_id, status: "pending" };
        } else if (user_target_id) {
            query = { user_id_send: user_id, user_id_receive: user_target_id, status: "pending" };
        } else {
            throw new Error("Either request_id or user_target_id must be provided");
        }
    
        const cancelRequest = await FriendShipModel.findOneAndDelete(query).lean();
    
        if (!cancelRequest) {
            throw new NotFoundError("Friend request does not exist");
        }
    
        return { cancelRequest };
    }
    
    static async denyFriendRequest(user_id, request_id, user_target_id) {
        let query;
        if (request_id) {
            query = { _id: request_id, user_id_receive: user_id, status: "pending" };
        } else if (user_target_id) {
            query = { user_id_send: user_target_id, user_id_receive: user_id, status: "pending" };
        } else {
            throw new Error("Either request_id or user_target_id must be provided");
        }
    
        const denyRequest = await FriendShipModel.findOneAndDelete(query).lean();
        
        if (!denyRequest) {
            throw new NotFoundError("Friend request does not exist");
        }
    
        const key = `listRequestsFriend:${user_id}`;
        RedisService.delete(key);
        return denyRequest;
    }
    
    static async searchFriend(user_id, filter) {
        filter = removeVietNamese(filter);
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
        console.log(transformedFriends)
    
        return transformedFriends.filter(friend => 
            regex.test(friend.user_name_remove_sign) ||
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
        const key1 = `listFriends:${user_id}`;
        const key2 = `listFriends:${friend_id}`;
        RedisService.delete(key1);
        RedisService.delete(key2)
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
        const key = `listRequestsFriend:${user_id}`;
        await RedisService.delete(key);
        return denyRequest
    }

    static async checkIsFriend(user_id, friend_id) {
        const isFriend = await FriendShipModel.findOne({
            $or: [
                { user_id_send: user_id, user_id_receive: friend_id },
                { user_id_send: friend_id, user_id_receive: user_id }
            ],
            status: "accepted"
        }).lean()
    
        return isFriend ? true : false;
    }

    static async CheckSentRequest(user_id, friend_id) {
        console.log('user id', user_id)
        console.log('friend id', friend_id)
        const request = await FriendShipModel.findOne({
            user_id_send: user_id,
            user_id_receive: friend_id,
            status: "pending"
        }).lean();

        return !!request;
    }

    static async CheckReceivedRequest(user_id, friend_id) {
        const request = await FriendShipModel.findOne({
            user_id_send: friend_id,
            user_id_receive: user_id,
            status: "pending"
        }).lean();

        return !!request;
    }

    static async listFriendsNotInRoomChat(userID, room_id) {
        const friends = await this.findFriends(userID);
    
        const friends_ids = friends.map(friend => {
            return userID.toString() === friend.user_id_send.toString() ? 
                friend.user_id_receive.toString() : friend.user_id_send.toString();
        });
    
        console.log(friends_ids);
    
        const room = await roomRepository.getRoomByID(room_id);
        const room_user_ids = room.user_ids.map(id => id.toString());
        
        const friends_not_in_room = friends_ids.filter(friend_id => 
            !room_user_ids.includes(friend_id.toString())
        );
    
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