"use strict";
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} = require("../core/error.response");
const User = require("../models/user.model");
const { sendEmailOTP } = require("./email.service");
const { verifyOTP } = require("./otp.service");

const sendOTPService = async (email, type) => {
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

const checkOTPService = async (email, otp, type) => {
  const result = await verifyOTP(email, otp, type);

  return result;
};

module.exports = { sendOTPService, checkOTPService };
