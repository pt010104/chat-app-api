const {
  BadRequestError,
  ForbiddenError,
  AuthFailureError,
} = require("../core/error.response");
const UserModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const KeyTokenService = require("./keyToken.service");
const { createTokenPair } = require("../auth/authUtils");
const RedisService = require('./redis.service'); 
class AuthService {

  static signUp = async (body) => {
    const checkUser = await UserModel
      .findOne({
        email: body.email,
      })
      .lean();

    if (checkUser) {
      throw new BadRequestError("User already exists");
    }

    body.password = await bcrypt.hash(body.password, 10);
    let newUser = await UserModel.create(body);

    const publicKey = crypto.randomBytes(64).toString("hex");
    const privateKey = crypto.randomBytes(64).toString("hex");
    const refreshToken = crypto.randomBytes(64).toString("hex");

    newUser = newUser.toObject();
    const data = {
      ...newUser,
      publicKey,
      privateKey,
      refreshToken,
    };
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
        tokens,
      },
    };
  };

  static signIn = async (body) => {

    //Check in redis first
    const redisKey = `user:${body.email}`;

    let user;
    const cachedUser = await RedisService.get(redisKey);
    user = cachedUser ? JSON.parse(cachedUser) : null;

    if (!user) {
      user = await UserModel.findOne({
        email: body.email,
      }).lean();
      if (user) {
        await RedisService.set(redisKey, JSON.stringify(user), 300); // 5 min
      }    
    }

    if (!user) {
      throw new AuthFailureError("Invalid email");
    }

    const checkPassword = await bcrypt.compare(
      body.password,
      user.password
    );
    if (!checkPassword) {
      throw new AuthFailureError("Invalid password");
    } 

    const publicKey = crypto.randomBytes(64).toString("hex");
    const privateKey = crypto.randomBytes(64).toString("hex");
    const refreshToken = crypto.randomBytes(64).toString("hex");

    const data = {
      ...user,
      publicKey,
      privateKey,
      refreshToken,
    };

    const keyStore = await KeyTokenService.createKeyToken(data);

    if (!keyStore) {
      throw new ForbiddenError("Key store not created");
    }

    const tokens = await createTokenPair(
      {
        userId: user._id,
        email: user.email,
      },
      publicKey,
      privateKey
    );

    return {
        user: user,
        tokens,
    };
  }

}

module.exports = AuthService;
