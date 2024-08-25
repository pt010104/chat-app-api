'use strict';

const OTP = require("../models/otp.model");
const { findUserByEmail } = require("../models/repository/user.repository");
const { createTokenPair } = require("../auth/authUtils");
const KeyTokenService = require("./keyToken.service");
const KeyRepository = require("../models/repository/key.repository");
const crypto = require("node:crypto");
const RedisService = require("./redis.service");

const generateOTPRandom = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

const newOTP = async ({ email, type }) => {
    const otp = generateOTPRandom();
    const key = `otp:${email}:${type}`;
   
    await RedisService.set(key, otp, 'EX', 180);

    return { email, otp, type };

    return newOTP;
};

const verifyOTP = async (email, otp, type) => {
    const key = `otp:${email}:${type}`;
    
    // Retrieve the OTP from Redis
    const storedOtp = await RedisService.get(key);
    
    if (!storedOtp || storedOtp !== otp) {
        throw new Error("OTP not found or invalid");
    }

    // Delete the OTP from Redis after verification
    await RedisService.delete(key);

    if (type === "reset-password") {
        const user = await findUserByEmail(email);
        const keyStore = await KeyTokenService.FindOrCreateKeyToken(user._id);

        const tokens = await createTokenPair(
            {
                email: email,
                userId: user._id,
            },
            keyStore.public_key,
            keyStore.private_key
        );
        
        return {
            otp: storedOtp,
            user_id: user._id,
            tokens: tokens
        };
    }

    return { email, otp, type };
};

module.exports = {
    newOTP,
    verifyOTP
};
