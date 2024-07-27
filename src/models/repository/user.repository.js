const userModel = require("../user.model")
const { BadRequestError, NotFoundError } = require("../../core/error.response")

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

module.exports = {
    findUserById,
    findUserByEmail
}