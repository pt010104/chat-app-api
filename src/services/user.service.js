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

  static SearchForUser = async (filter, userID) => {
      const users = await UserModel.find({
        $and: [
          { _id: { $ne: userID } },
          {
            $or: [
              { name: { $regex: filter, $options: "i" } },
              { email: filter },
              { phone: filter },
            ],
          },
        ],
      }).select("-password");
  
      return users;
  }
}


module.exports = UserService;
