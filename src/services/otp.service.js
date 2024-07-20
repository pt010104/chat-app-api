'use strict';

const OTP = require("../models/otp.model");
const { findUserByEmail } = require("../models/repository/user.repository");
const { createTokenPair } = require("../auth/authUtils");
const KeyTokenService = require("./keyToken.service");
const crypto = require("node:crypto");

const generateOTPRandom = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

const newOTP = async ({ email, type }) => {
    const otp = generateOTPRandom();
    const newOTP = await OTP.findOneAndUpdate({
        email: email,
        type: type
    }, {
        email: email,
        otp: otp,
        type: type
    }, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
    })

    return newOTP;
};

const verifyOTP = async (email, otp, type) => {
    const _otp = await OTP.findOne({
        email: email,
        otp: otp,
        type: type,
    });

    if (!_otp) {
        throw new Error("OTP not found or invalid");
    }

    await OTP.deleteOne({
        email: email,
        otp: otp,
        type: type
    })

    if (type == "reset-password" || type == "change-password") {
        const user = await findUserByEmail(email);
        const publicKey = crypto.randomBytes(64).toString("hex");
        const privateKey = crypto.randomBytes(64).toString("hex");
        const refreshToken = crypto.randomBytes(64).toString("hex");
    
        const data = {
          _id: user._id,
          publicKey,
          privateKey,
          refreshToken,
        };
    
        const keyStore = await KeyTokenService.createKeyToken(data);
    

        const tokens = await createTokenPair({
                email: email,
                userId: user._id,
            },
            publicKey,
            privateKey
        );
        
        return {
            otp: _otp,
            user_id: user._id,
            tokens: tokens
        };
    }

    return _otp;
};

module.exports = {
    newOTP,
    verifyOTP
};
