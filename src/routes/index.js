'use strict'

const express = require("express");
const path = require("path"); // Import the path module
const router = express.Router();

// API document nha
router.use("/api-docs", express.static(path.join(__dirname, 'api-docs')));


router.get('/page1', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

router.get('/page2', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index2.html'));
});

router.use('/bakery', express.static(path.join(__dirname, '../public/MIS Final Project')));

router.get('/bakery', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/MIS Final Project', 'index.html'));
});

// Serve static files from 'Order'
router.use('/bakery/order', express.static(path.join(__dirname, '../public/MIS Final Project/Order')));

// Serve static files from 'Locations'
router.use('/bakery/Locations', express.static(path.join(__dirname, '../public/MIS Final Project/Locations')));

// Serve static files from 'Our Story'
router.use('/bakery/our-story', express.static(path.join(__dirname, '../public/MIS Final Project/Our Story')));





router.use("/v1/api/auth", require ("./auth"))
router.use("/v1/api/profile", require ("./profile"))
router.use("/v1/api/upload", require ("./upload"))
router.use("/v1/api/email", require ("./email"))
router.use("/v1/api/user", require ("./user"))
router.use("/v1/api/friends", require ("./friends"))
router.use("/v1/api/room", require ("./chat"))
router.use("/v1/api/comment", require ("./comment"))

module.exports = router

