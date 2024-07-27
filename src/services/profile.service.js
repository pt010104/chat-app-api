const {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
  } = require("../core/error.response");
const user = require("../models/user.model");
const RedisService = require('./redis.service');
  
class ProfileService {
  static infoProfile = async (id) => {

    const redisKey = `user:info:${id}`;

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
    return {
        user: userInfo
    };
  }

  static updateInfo = async (id, updateInfo) => {
    const userInfo = await user.findOne({
      _id: id
    }).lean().select("-password");
    if(!userInfo){
      throw new NotFoundError("User does not exist");
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
    })

    await RedisService.set(`user:info:${id}`, JSON.stringify(newUserInfo));

    return {
        user: newUserInfo
    };
      
  }
}

module.exports = ProfileService;
