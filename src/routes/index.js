'use strict'

const express = require ("express")
const router = express.Router()
//check apiKey
router.use("/v1/api/auth", require ("./auth"))

//handling error 

module.exports = router

