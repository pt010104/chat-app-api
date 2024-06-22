'use strict'

const OTP = require("../models/otp.model")

const generateOTPRandom = () => {
    return Math.floor(1000 + Math.random() * 9000)
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

module.exports = {
    newOTP
}