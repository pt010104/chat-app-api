"use strict"

function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString(); 
}

function removeVietNamese(str) {
    return str
        .normalize('NFD') 
        .replace(/[\u0300-\u036f]/g, '') 
        .replace(/đ/g, 'd') 
        .replace(/Đ/g, 'D') 
        .replace(/\s+/g, ' ')
        .trim(); 
}

module.exports = { 
    generateOTP,
    removeVietNamese
 };