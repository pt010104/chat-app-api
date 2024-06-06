'use strict'

const express = require ("express")
const router = express.Router()

router.use("/v1/api/auth", require ("./auth"))
router.use("/v1/api/profile", require ("./profile"))
router.use("/v1/api/upload", require ("./upload"))

// user profile
module.exports = router

