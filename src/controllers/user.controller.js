const { SuccessResponse } = require("../core/success.response");
const { sendOTPService, checkOTPService } = require("../services/user.service");
const Joi = require("joi");

class UserController {

    sendOTP = async (req, res, next) => {
        const otpValidate = Joi.object({
            email: Joi.string().email().required(),
            type: Joi.string().valid('new-user', 'reset-password').required(),
        });

        const { error } = otpValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message,
            });
        }

        const { email, type, captcha } = req.body;
        const message = type === 'new-user' ? 'Email sent successfully for new user' : 'Email sent successfully for password reset';
        new SuccessResponse({
            message,
            metadata: await sendOTPService(email, type)
        }).send(res);
    }

    checkOTP = async (req, res, next) => {
        const otpCheckValidate = Joi.object({
            email: Joi.string().email().required(),
            otp: Joi.string().required(),
            type: Joi.string().valid('new-user', 'reset-password').required()
        });

        const { error } = otpCheckValidate.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message,
            });
        }

        const { email, otp, type } = req.body;
        new SuccessResponse({
            message: "OTP verified successfully",
            metadata: await checkOTPService(email, otp, type)
        }).send(res);
    }
}

module.exports = new UserController();
