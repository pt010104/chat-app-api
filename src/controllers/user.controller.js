const { SuccessResponse } = require("../core/success.response");
const { sendOTPService, checkOTPService } = require("../services/user.service");
const Joi = require("joi");

class UserController {
  sendOTP = async (req, res, next) => {
    const otpValidate = Joi.object({
      email: Joi.string().email().required(),
      type: Joi.string().valid("new-user", "reset-password").required(),
    });

    const { error } = otpValidate.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const { email, type } = req.body;
    let message;
    switch (type) {
      case "new-user":
        message = "Email sent successfully for new user";
        break;
      case "reset-password":
        message = "Email sent successfully for password reset";
        break;
    }
    new SuccessResponse({
      message,
      metadata: await sendOTPService(email, type),
    }).send(res);
  };

  sendOTPChangePassword = async (req, res, next) => {
    const emailUser = req.user.email;
    new SuccessResponse({
      message: "Email sent successfully for password change",
      metadata: await sendOTPService(emailUser, 'change-password'),
    }).send(res);
  };

  checkOTP = async (req, res, next) => {
    const otpCheckValidate = Joi.object({
        email: Joi.string().email().when('type', {
            is: Joi.valid('new-user', 'reset-password'),
            then: Joi.required(),
            otherwise: Joi.optional()
        }),
        otp: Joi.string().required(),
        type: Joi.string().valid("new-user", "reset-password", "change-password").required(),
    });

    const { error } = otpCheckValidate.validate(req.body);
    if (error) {
        return res.status(400).json({
            message: error.details[0].message,
        });
    }

    let email;

    if (type == 'change-password') {
        email = req.user.email;
    } else {
        email = req.body.email;
    }

    const { otp, type } = req.body;

    new SuccessResponse({
      message: "OTP verified successfully",
      metadata: await checkOTPService(email, otp, type),
    }).send(res);
  };
}

module.exports = new UserController();
