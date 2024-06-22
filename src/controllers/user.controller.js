const { SuccessResponse } = require("../core/success.response");
const { newUser } = require("../services/user.service");

class UserController {

    // New User
    newUser = async (req, res, next) => {
        new SuccessResponse({
            message: "Email sent successfully for new user", 
            metadata: await newUser(req.body.email, req.body.capcha)
        }).send(res);
    }

    checkRegisterEmailOTP = async () => {

    }
}

module.exports = new UserController()