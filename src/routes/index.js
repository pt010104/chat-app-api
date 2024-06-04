'use strict'

const express = require ("express")
const router = express.Router()
//check apiKey
router.use("/v1/api/auth", require ("./auth"))

//handling error 

// user profile
router.use("/v1/api/profile", require ("./profile"))
module.exports = router

