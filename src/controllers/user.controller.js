const { SuccessResponse } = require("../core/success.response");
const { newUser, checkOTPService } = require("../services/user.service");

class UserController {

    // New User
    newUser = async (req, res, next) => {
        new SuccessResponse({
            message: "Email sent successfully for new user", 
            metadata: await newUser(req.body.email, req.body.capcha)
        }).send(res);
    }
    checkOTP = async (req, res, next) => {
        new SuccessResponse({
            message: "OTP verified successfully",
            metadata: await checkOTPService(req.body.email, req.body.otp)
        }).send(res);
    }
}

module.exports = new UserController()