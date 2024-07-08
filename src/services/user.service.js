'use strict';
const { BadRequestError, NotFoundError, ForbiddenError } = require('../core/error.response');
const User = require('../models/user.model');
const { sendEmailOTP } = require('./email.service');
const { checkOTP, newOTP } = require('./otp.service');

const sendOTPService = async (email, type, emailUser = '') => {

    // Nếu user muốn thay đổi mật khẩu thì emailUser phải trùng với email của user đó
    if (type === 'change-password') {
        if (email !== emailUser) {
            throw new ForbiddenError("Permission denied");
        }
    }

    // Check if email exists
    const user = await User.findOne({ email }).lean();

    if (type === 'new-user') {
        if (user) {
            throw new BadRequestError("Email already exists");
        }
    } else if (type === 'reset-password' || type === 'change-password') {
        if (!user) {
            throw new NotFoundError("User with this email does not exist");
        }
    }


    // Send OTP
    const result = await sendEmailOTP(email, type);
    return result;
};

const checkOTPService = async (email, otp, type) => {
    const isOTP = await checkOTP(email, otp, type);
    return isOTP;
};

module.exports = { sendOTPService, checkOTPService };
