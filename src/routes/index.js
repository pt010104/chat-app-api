'use strict'

const express = require ("express")
const router = express.Router()

router.use("/v1/api/auth", require ("./auth"))
router.use("/v1/api/profile", require ("./profile"))
router.use("/v1/api/upload", require ("./upload"))
router.use("/v1/api/email", require ("./email"))
router.use("/v1/api/user", require ("./user"))
router.use("/v1/api/friends", require ("./friends"))
// user profile
module.exports = router

