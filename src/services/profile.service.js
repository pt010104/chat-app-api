const {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
  } = require("../core/error.response");
const user = require("../models/user.model");
const RedisService = require("./redis.service");

  
  class ProfileService {
    static infoProfile = async (id) => {
      const redisKey = `user:profile:${id}`;
      let userInfo;

      const cachedUserInfo = await RedisService.get(redisKey);
      if (cachedUserInfo) {
        userInfo = JSON.parse(cachedUserInfo);
      }
      else {
        userInfo = await user.findOne({
          _id: id
        }).lean().select("-password");

        if(!userInfo) {
            throw new NotFoundError("User does not exist");
        }
        await RedisService.set(redisKey, JSON.stringify(userInfo), 600); // 10 minutes

      }

      
      return {
        user: userInfo
      };
    }
  }
  
  module.exports = ProfileService;
  