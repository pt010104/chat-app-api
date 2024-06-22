'use strict'
const { BadRequestError } = require('../core/error.response')
const User = require('../models/user.model')
const { sendEmailOTP } = require('./email.service')
const { NotFoundError } = require('../core/error.response')

const newUser = async (
    email = null, capcha = null
) => {

    // 1. Check email exists in dbs or not
    const user = await User.findOne({
        email: email
    }).lean()

    // 2. if exists
    if (user) {
        throw new BadRequestError("Email already exists")
    }

    //3. Send email otp
    //Send OTP
    const result = await sendEmailOTP('thinhfb1278@gmail.com', 'Xác thực Email')
    return {
        message: "Email sent successfully", 
        metadata: {
            result
        }
    }
}

module.exports = {newUser}