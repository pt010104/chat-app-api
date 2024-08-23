const {
  BadRequestError,
  ConflictRequestError,
  AuthFailureError,
} = require("../core/error.response");
const UserModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const KeyTokenService = require("./keyToken.service");
const { createTokenPair } = require("../auth/authUtils");
const RedisService = require("./redis.service");

class AuthService {

  static signUp = async (body) => {
    const checkUser = await UserModel.findOne({
      email: body.email,
    }).lean();

    if (checkUser) {
      throw new ConflictRequestError("User already exists");
    }

    body.password = await bcrypt.hash(body.password, 10);

    // Set default avt cho user
    const defaultAvt = "https://i.pinimg.com/474x/8a/eb/67/8aeb672598aaabad530c6f401fc2cf35.jpg";
    body.avatar = defaultAvt;
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
      throw new BadRequestError("Key store not created");
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
      user: newUser,
      tokens,
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
        await RedisService.set(redisKey, JSON.stringify(user), 3600); 
      }
    }

    if (!user) {
      throw new AuthFailureError("Invalid email");
    }

    const checkPassword = await bcrypt.compare(body.password, user.password);
    if (!checkPassword) {
      throw new AuthFailureError("Invalid password");
    }

    const keyStore = await KeyTokenService.FindOrCreateKeyToken(user._id);
    if (!keyStore) {
      throw new BadRequestError("Key store not created");
    }

    const tokens = await createTokenPair(
      {
        userId: user._id,
        email: user.email,
      },
      keyStore.public_key,
      keyStore.private_key
    );

    return {
      user: user,
      tokens,
    };
  };


  static forgetPassword = async (userId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId },
      { password: hashedPassword },
      { new: true, runValidators: true }
    ).lean();
    if (!updatedUser) {
      throw new NotFoundError("User does not exist");
    }

    RedisService.delete(`user:${updatedUser.email}`);

    await KeyTokenService.removeKeyToken(userId);

    return;
  };

  static changePassword = async (userId, oldPassword, newPassword) => {
    const user = await UserModel.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const checkPassword = await bcrypt.compare(oldPassword, user.password);
    if (!checkPassword) {
      throw new AuthFailureError("Password does not match");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword; 
    await user.save();

    RedisService.delete(`user:${user.email}`);

    const publicKey = crypto.randomBytes(64).toString("hex");
    const privateKey = crypto.randomBytes(64).toString("hex");
    const refreshToken = crypto.randomBytes(64).toString("hex");

    const data = {
      _id: userId,
      publicKey,
      privateKey,
      refreshToken,
    };

    const keyStore = await KeyTokenService.createKeyToken(data);
    if (!keyStore) {
      throw new BadRequestError("Key store not created");
    }

    const tokens = await createTokenPair(
      {
        userId: user._id,
        email: user.email,
      },
      publicKey,
      privateKey
    );

    return tokens;

  }

}

module.exports = AuthService;
