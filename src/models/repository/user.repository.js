const user = require("../user.model")
const { BadRequestError } = require("../../core/error.response")

const findUserById = async (id) => {
    try {
        const userFound = await user.findById(id).lean()
        return userFound
    } catch (error) {
        throw new BadRequestError(error)
    }
}

module.exports = {
    findUserById
}