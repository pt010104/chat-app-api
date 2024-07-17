"use strict";
const { OK, CREATED, SuccessResponse } = require("../core/success.response");
const { BadRequestError, ForbiddenError } = require("../core/error.response");
const Joi = require("joi");
const AuthService = require("../services/auth.service");

class AuthController {
  
  signUp = async (req, res, next) => {
    const signUpValidate = Joi.object({
      name: Joi.string().alphanum().min(3).max(30).required(),
      password: Joi.string().min(8).max(30).required(),
      email: Joi.string().email().required(),
    });

    const { error } = signUpValidate.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    const { body } = req;
    new CREATED({
      message: "User created successfully",
      metadata: await AuthService.signUp(body),
    }).send(res);
  };

  signIn = async (req, res, next) => {
    const signInValidate = Joi.object({
      password: Joi.string().min(8).max(30).required(),
      email: Joi.string().email().required(),
    });

    const { error } = signInValidate.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    } 
    else {
      new SuccessResponse({
        message: "User signed in successfully",
        metadata: await AuthService.signIn(req.body),
      }).send(res);
    }
  };
  
  signOut = async (req, res, next) => {
    new OK({
      message: "User signed out successfully",
      metadata: await AuthService.signOut(req.user.userId),
    }).send(res);
  };
}
module.exports = new AuthController();
