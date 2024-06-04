const {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
  } = require("../core/error.response");
const user = require("../models/user.model");

  
  class ProfileService {
    static infoProfile = async (id) => {
        const userInfo = await user.findOne({
            _id: id
        }).lean().select("-password");
        if(!userInfo) {
            throw new NotFoundError("User does not exist");
        }
        else{
            return {
                code: 200,
                metadata: {
                  user: userInfo
                },
              };
        }
    }
  }
  
  module.exports = ProfileService;
  