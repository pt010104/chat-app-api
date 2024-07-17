'use strict';

const OTP = require("../models/otp.model");

const generateOTPRandom = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

const newOTP = async ({ email, type }) => {
    const checkOTP = await OTP.findOne({
        email: email,
        type: type
    });

    if (checkOTP) {
        await checkOTP.updateOne({
            otp: generateOTPRandom(),
            expire_at: new Date(Date.now() + 120000)
        });
        checkOTP.save();
        return checkOTP;
    }

    const otp = generateOTPRandom();
    const newOTP = await OTP.create({
        otp: otp,
        email: email,
        type: type,
    });

    return newOTP;
};

const checkOTP = async (email, otp, type) => {
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
    
    return _otp;
};

module.exports = {
    newOTP,
    checkOTP
};
