"use strict"

const cloudinary = require('cloudinary').v2;
require('dotenv').config(); 

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: "329538994514118",
    api_secret: process.env.API_SECRET
})

console.log('Cloudinary connected')

module.exports = cloudinary