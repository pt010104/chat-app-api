"use strict";
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../core/error.response");
const UserModel = require("../models/user.model");
const { sendEmailOTP } = require("./email.service");
const { verifyOTP } = require("./otp.service");
const RedisService = require("./redis.service");
const { transformUser } = require("../models/repository/user.repository");
const FriendShipService = require("./friendship.service");
const { removeVietNamese } = require("../utils");

class UserService {
  static sendOTP = async (email, type) => {
    // Check if email exists
    const user = await UserModel.findOne({ email }).lean();
  
    if (type === "new-user") {
      if (user) {
        throw new BadRequestError("Email already exists");
      }
    } else if (type === "reset-password" || type === "change-password") {
      if (!user) {
        throw new NotFoundError("User with this email does not exist");
      }
    }
  
    // Send OTP
    const result = await sendEmailOTP(email, type);
    return result;
  };
  
  static checkOTP = async (email, otp, type) => {
    const result = await verifyOTP(email, otp, type);
    return result;
  };

  static async SearchForUser(filter, userID) {
    filter = removeVietNamese(filter);
    let users = await UserModel.find({
        $and: [
            { _id: { $ne: userID } },
            {
                $or: [
                    { name_remove_sign: { $regex: filter, $options: "i" } },
                    { email: filter },
                    { phone: filter },
                ],
            },
        ],
    }).select("-password").lean();    

    const userChecks = await Promise.all(users.map(async (user) => {
        const is_friend = await FriendShipService.checkIsFriend(userID, user._id);
        const is_sent_request = await FriendShipService.CheckSentRequest(userID, user._id);
        const is_received_request = await FriendShipService.CheckReceivedRequest(userID, user._id);
        return {
            ...user,
            is_friend,
            is_sent_request,
            is_received_request
        };
    }));

    const transformedUsers = transformUser(userChecks);

    return transformedUsers;
  }

}


module.exports = UserService;
