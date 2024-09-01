const { filter } = require("compression");
const {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
  } = require("../core/error.response");
const user = require("../models/user.model");
const RedisService = require('./redis.service');
const RoomRepository = require("../models/repository/room.repository");
const FriendService = require("./friendship.service");

class ProfileService {
  static infoProfile = async (id, userID) => {

    const redisKey = `user:${id}`;

    let userInfo;
    const cacheduserInfo = await RedisService.get(redisKey);
    userInfo = cacheduserInfo ? JSON.parse(cacheduserInfo) : null;

    if (!userInfo) {
      userInfo = await user.findOne({
        _id: id
      }).lean().select("-password");
      if (userInfo) {
        await RedisService.set(redisKey, JSON.stringify(userInfo));
      }    
    }

    if(!userInfo) {
        throw new NotFoundError("User does not exist");
    }

    if (userID != id) {
      const [is_friend, is_received_request, is_sent_request] = await Promise.all([
        FriendService.checkIsFriend(userID, id),
        FriendService.CheckReceivedRequest(userID, id),
        FriendService.CheckSentRequest(userID, id)
      ]);

      userInfo.is_friend = is_friend;
      userInfo.is_sent_request = is_sent_request;
      userInfo.is_received_request = is_received_request;
    }

    return {
      user: userInfo
    };
  }

  static updateUserCache = async (newUserInfo) => { 
    if (newUserInfo) {
      const redisOperations = [];
      redisOperations.push(RedisService.set(`user:${newUserInfo._id}`, JSON.stringify(newUserInfo), 7200))
      redisOperations.push(RedisService.delete(`user:${newUserInfo.email}`))

      await Promise.all(redisOperations);
    } else {
      throw new BadRequestError("User does not exist");
    }

    return;
  }

  static updateInfo = async (id, updateInfo) => {
    let userInfo = await RedisService.get(`user:${id}`);
    userInfo = userInfo ? JSON.parse(userInfo) : null;
    if (!userInfo) {
      const userInfo = await user.findOne({
        _id: id
      }).lean().select("-password");
      if(!userInfo){
        throw new NotFoundError("User does not exist");
      }
    }

    const newUserInfo = await user.findOneAndUpdate(
    {
      _id: id
    },
    updateInfo,
    {
      upsert: true,
      runValidators: true,
      new: true
    }).lean().select("-password");

    await this.updateUserCache(newUserInfo);

    return {
        user: newUserInfo
    };
      
  }
}

module.exports = ProfileService;
