'use strict'

const express = require("express");
const path = require("path"); // Import the path module
const router = express.Router();

// API document nha
router.get("/api-docs", (req, res) => {
    res.sendFile(path.join(__dirname, '/api-doc.html'));
});

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

router.get('/page2', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index2.html'));
});

router.use("/v1/api/auth", require ("./auth"))
router.use("/v1/api/profile", require ("./profile"))
router.use("/v1/api/upload", require ("./upload"))
router.use("/v1/api/email", require ("./email"))
router.use("/v1/api/user", require ("./user"))
router.use("/v1/api/friends", require ("./friends"))
router.use("/v1/api/chat", require ("./chat"))
// user profile
module.exports = router

