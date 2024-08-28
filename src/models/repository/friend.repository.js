const userModel = require("../user.model");
const { NotFoundError } = require("../../core/error.response");
const FriendShipModel = require('../friendship.model')

class FriendRepository {
    static async listFriends(user_id) {
        const friends = await FriendShipModel.find({
            $or: [
                { user_id_send: user_id, status: "accepted" },
                { user_id_receive: user_id, status: "accepted" }
            ]
        }).lean();
        
        return friends;
    }

    static async transformFriend(user) {
        console.log('user:::', user)
        const user_info = {
            id: user._id,
            user_name: user.name,
            user_email: user.email,
            user_name_remove_sign: user.name_remove_sign,
            user_phone: user.phone,
            avatar: user.avatar,
        };
        return user_info;
    }

    

}

module.exports = FriendRepository;
