"use strict";

const keyToken = require("../models/keytoken.model");

class KeyTokenService {
  static createKeyToken = async (data) => {
    try {
      const tokenData = {
        user_id: data._id,
        public_key: data.publicKey,
        private_key: data.privateKey,
        refresh_token: data.refreshToken,
      };

      const tokens = await keyToken.findOneAndUpdate(
        {
          user_id: data._id,
        },
        tokenData,
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
      return tokens;
    } catch (error) {
      throw new Error(error);
    }
  };
  static removeKeyToken = async (userId) => {
    try {
      const tokens = await keyToken.findOneAndDelete({
        user_id: userId,
      });
      return tokens;
    } catch (error) {
      throw new Error(error);
    }
  };
}

module.exports = KeyTokenService;
