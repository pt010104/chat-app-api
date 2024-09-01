const userModel = require("../user.model");
const { BadRequestError, NotFoundError } = require("../../core/error.response");
const RedisService = require("../../services/redis.service");

const findUserById = async (id) => {
    try {
        const key = `user:${id}`;
        let userFound = await RedisService.get(key);

        if (userFound) {
            userFound = JSON.parse(userFound);
            return userFound;
        }

        userFound = await userModel.findOne({ _id: id }).lean();
        if (!userFound) {
            throw new NotFoundError("User not found");
        }

        await RedisService.set(key, JSON.stringify(userFound), 7200);

        return userFound;
    } catch (error) {
        throw new BadRequestError(error);
    }
};

const findUserByEmail = async (email) => {
    const userFound = await userModel.findOne({ email }).lean();
    if (!userFound) {
        throw new NotFoundError("User not found");
    }
    
    return userFound;
};

const transformUser = (users) => {
    return users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        is_friend: user.is_friend,
        is_sent_request: user.is_sent_request,
        is_received_request: user.is_received_request,
        mutual_friends: user.mutual_friends,
    }));
};

module.exports = {
    findUserById,
    findUserByEmail,
    transformUser,
};
