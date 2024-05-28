'use strict'

const express = require ("express")
const router = express.Router()
const AuthController = require ("../../controllers/auth.controller")
const {asyncHandler} = require("../../helpers/asyncHandler")

//register
router.post ("/signup", asyncHandler(AuthController.signUp))

// router.use(authentication)

module.exports = router

