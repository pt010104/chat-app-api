const { BadRequestError } = require("../../core/error.response")
const keytoken = require("../keytoken.model")

const findKeyByUserID = async (userId) => {
    try {
        const keyFound = await keytoken.findOne({ user_id: userId }).lean()
        return keyFound
    } catch (error) {
        throw new BadRequestError(error)
    }
}

module.exports = {
    findKeyByUserID
}