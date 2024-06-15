const {
  BadRequestError,
  ForbiddenError,
  AuthFailureError,
} = require("../core/error.response");
const user = require("../models/user.model");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const KeyTokenService = require("./keyToken.service");
const { createTokenPair } = require("../auth/authUtils");
const { sendEmail } = require('./email.service');
const { generateOTP } = require('../utils');

class AuthService {

  static signUp = async (body) => {
    const checkUser = await user
      .findOne({
        email: body.email,
      })
      .lean();

    if (checkUser) {
      throw new BadRequestError("User already exists");
    }

    body.password = await bcrypt.hash(body.password, 10);
    let newUser = await user.create(body);

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
    
    //Send OTP
    const otp = generateOTP();
    try {
      await sendEmail('thinhfb1278@gmail.com', 'OTP Sign Up', otp)
    }
    catch (error) {
      throw new AuthFailureError(error);
    }

    return {
      code: 201,
      metadata: {
        user: newUser,
        tokens,
      },
    };
  };
  static signIn = async (body) => {
    const checkEmail = await user
      .findOne({
        email: body.email,
      })
      .lean();
      
    const checkPassword = await bcrypt.compare(
      body.password,
      checkEmail.password
    );
    if (!checkEmail || !checkPassword) {
      throw new AuthFailureError("Invalid email or password");
    } else {
      const publicKey = crypto.randomBytes(64).toString("hex");
      const privateKey = crypto.randomBytes(64).toString("hex");
      const refreshToken = crypto.randomBytes(64).toString("hex");

      const data = {
        ...checkEmail,
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
          userId: checkEmail._id,
          email: checkEmail.email,
        },
        publicKey,
        privateKey
      );

      return {
        code: 200,
        metadata: {
          user: checkEmail,
          tokens,
        },
      };
    }
  };
}

module.exports = AuthService;
