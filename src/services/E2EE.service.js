'use strict'
const crypto = require("node:crypto");
const purse = require('../Global/Global');

class E2EE {

    static async generateKeyPairForRoom(room_id) {
        // Generate RSA key pair
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        });
        // Store the key pair in the purse array with the associated room_id
        purse.push({ room_id, publicKey, privateKey });
    }
    
    static async getKeyPairByRoom(room_id) {
        // Find and return the key pair for the specified room_id
        return purse.find(pair => pair.room_id === room_id);
    }
    
    static getPublicKeyByRoom = async  (room_id)=>{
        const pair = purse.find(pair => pair.room_id === room_id);
        if (!pair) {
            throw new Error(`Public key not found for room_id: ${room_id}`);
        }
        return pair.publicKey;
    }
    
    static async getPrivateKeyByRoom(room_id) {
        const pair = purse.find(pair => pair.room_id === room_id);
        if (!pair) {
            throw new Error(`Private key not found for room_id: ${room_id}`);
        }
        return pair.privateKey;
    }
    
    static encryptMessage = async (publicKey, message) => {
        // Encrypt a message using the provided public key
        return crypto.publicEncrypt(publicKey, Buffer.from(message)).toString('base64');
    }

    static decryptMessage = async (privateKey, encryptedMessage) => {
        // Decrypt an encrypted message using the provided private key
        return crypto.privateDecrypt(privateKey, Buffer.from(encryptedMessage, 'base64')).toString('utf8');
    }
    
    static async clearKeys() {
        // Clear all keys
        purse.length = 0;
    }
}

module.exports = E2EE;
