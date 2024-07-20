const { BadRequestError, NotFoundError } = require("../../core/error.response")
const keytoken = require("../keytoken.model")

const findKeyByUserID = async (userId) => {
    keys = await keytoken.findOne({ user_id: userId }).lean()
    
    return keys
}

module.exports = {
    findKeyByUserID
}