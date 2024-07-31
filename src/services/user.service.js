"use strict";
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../core/error.response");

const User = require("../models/user.model");
const { sendEmailOTP } = require("./email.service");
const { verifyOTP } = require("./otp.service");
const UserRepository = require("../models/repository/user.repository");

class UserService {
  static sendOTPService = async (email, type) => {
    // Check if email exists
    const user = await User.findOne({ email }).lean();

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

  static checkOTPService = async (email, otp, type) => {
    const result = await verifyOTP(email, otp, type);

    return result;
  };

  static searchForUser = async (searchQuery, limit = 10, page = 1) => {
    const redisKey = `userSearch:${searchQuery}`;
  
    let searchResults = await RedisService.get(redisKey);
    let users;
  
    if (searchResults) {
      users = JSON.parse(searchResults);
    } else {
      const regex = new RegExp(searchQuery, 'i');
      const query = {
        $or: [
          { username: regex },
          { email: regex },
          { fullName: regex }
        ]
      };
  
      users = await userModel.find(query)
        .select('-password')
        .lean();
  
      if (users.length === 0) {
        throw new NotFoundError('No users found matching the search criteria');
      }
  
      await RedisService.set(redisKey, JSON.stringify(users), 300); // Cache for 5 minutes
    }
  
    const totalCount = users.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);
  
    const result = {
      users: paginatedUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalResults: totalCount
      }
    };
  
    return result;
  }

}

module.exports = UserService;
