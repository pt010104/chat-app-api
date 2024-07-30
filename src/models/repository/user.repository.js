const userModel = require("../user.model")
const { BadRequestError, NotFoundError } = require("../../core/error.response")
const UserProfile = require("../../services/profile.service")
const findUserById = async (id) => {
    try {
        const userFound = await userModel.findById(id).lean()
        return userFound
    } catch (error) {
        throw new BadRequestError(error)
    }
}

const findUserByEmail = async (email) => {
    const userFound = await userModel.findOne({ email }).lean()
    if (!userFound) {
        throw new NotFoundError("User not found")
    }
    
    return userFound
}


class transformData {
    static transformUser = async (user_id) => {
        const user = await UserProfile.infoProfile(user_id);
        if (!user) {
            throw new NotFoundError("User does not exist");
        }
        console.log(JSON.stringify(user));
        const user_info = {
            user_name: user.user.name,
            avatar:user.user.avatar
        }
        console.log("meo"+ JSON.stringify(user_info.user_name));
        return user_info;
    }

    static findFriend = async (user_id,keyword) => {
        const user = await userModel.findById({
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
                { phone: { $regex: keyword, $options: 'i' } }
            ],
            _id: { $ne: user_id }
        }).lean()
        if (!user) {
            throw new NotFoundError("User not found")
        }
        return user;
    }
}
module.exports = {
    findUserById,
    findUserByEmail,
    transformData
}