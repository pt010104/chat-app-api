'use strict'

const OTP = require("../models/otp.model")

const generateOTPRandom = () => {
    return Math.floor(100000 + Math.random() * 900000)
}

const newOTP = async ({
    email = null
}) => {

    const otp = generateOTPRandom()
    const newOTP = await OTP.create({
        otp: otp,
        email: email
    })

    return newOTP

}

const checkOTP = async (email, otp) => {
    const _otp = await OTP.findOne({
        email: email,
        otp: otp
    })
    if (!_otp) {
        throw new Error("OTP not found")
    }

    await OTP.deleteOne({
        email: email,
        otp: otp
    })

    return _otp
}
module.exports = {
    newOTP,
    checkOTP
}

