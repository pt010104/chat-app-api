'use strict'

const express = require("express");
const path = require("path"); // Import the path module
const router = express.Router();

// API document nha
router.get("/api-docs", (req, res) => {
    res.sendFile(path.join(__dirname, '/api-doc.html'));
});

module.exports = router; // Make sure to export the router if it's not already being exported

router.use("/v1/api/auth", require ("./auth"))
router.use("/v1/api/profile", require ("./profile"))
router.use("/v1/api/upload", require ("./upload"))
router.use("/v1/api/email", require ("./email"))
router.use("/v1/api/user", require ("./user"))
router.use("/v1/api/friends", require ("./friends"))
// user profile
module.exports = router

