const { BadRequestError, ForbiddenError ,AuthFailureError } = require('../core/error.response')
const user = require('../models/user.model')
const bcrypt = require('bcrypt')
const crypto = require('node:crypto')
const KeyTokenService = require('./keyToken.service')
const { createTokenPair } = require('../auth/authUtils')

class AuthService 
{

    static signUp = async (body) => {

        const checkUser = await user.findOne({
            email: body.email
        }).lean();

        if (checkUser) {
            throw new BadRequestError("User already exists");
        }

        body.password = await bcrypt.hash(body.password, 10);
        let newUser = await user.create(body);

        const publicKey = crypto.randomBytes(64).toString('hex');
        const privateKey = crypto.randomBytes(64).toString('hex');
        const refreshToken = crypto.randomBytes(64).toString('hex');

        newUser = newUser.toObject();
        const data = {
            ...newUser,
            publicKey,
            privateKey,
            refreshToken
        }
        const keyStore = await KeyTokenService.createKeyToken(data);

        if (!keyStore) {
            throw new ForbiddenError("Key store not created");
        }

        const tokens = await createTokenPair(
            {
                userId: newUser._id,
                email: newUser.email,
            }, 
            publicKey, 
            privateKey
        );

        return {
            code: 201,
            metadata: {
                user: newUser,
                tokens
            }
        };

    }
}

module.exports = AuthService