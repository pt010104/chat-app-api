'use strict'
const crypto = require("node:crypto");
const purse = require('../Global/Global');
const fs = require("node:fs");
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
        purse.push({ room_id, privateKey });
        await this.saveKeys();
        return publicKey;
    }
    
    static async getKeyPairByRoom(room_id) {
        // Find and return the key pair for the specified room_id
        return purse.find(pair => pair.room_id === room_id);
    }
    
    static getPublicKeyByRoom = async  (room_id)=>{
        const pair = purse.find(pair => pair.room_id === room_id);
        if (!pair) {
            throw new Error(`Public key not found for room_id: ${room_id}, room not found`);
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
    
    static getPairKeyByRoom = async (room_id) => {
        const pair = purse.find(pair => pair.room_id === room_id);
        if (!pair) {
            throw new Error(`Pair key not found for room_id: ${room_id}`);
        }
        return pair;
    }

    static async setPublicKeyByRoom(room_id, publicKey) {
        // Set the public key for the specified room_id
        const pair = purse.find(pair => pair.room_id === room_id);
        if (!pair) {
            throw new Error(`Public key not found for room_id: ${room_id}`);
        }
        pair.publicKey = publicKey;
        await this.saveKeys();
    }

    static async setUserInRoom(room_id){
        const publicKey= null;
        const privateKey= null;
        purse.push({room_id, privateKey});
    }

    static async checkPurseHasRoom(room_id){
        const pair = purse.find(pair => pair.room_id === room_id);
        if (!pair) {
            return false;
        }
        return true;
    }
    
    static encryptMessage = async (publicKey,message) => {
        return crypto.publicEncrypt(publicKey, Buffer.from(message)).toString('base64');
    }

    static decryptMessage = async (room_id, encryptedMessage) => {
        // Decrypt an encrypted message using the provided private key
        const privateKey = await this.getPrivateKeyByRoom(room_id);
        return crypto.privateDecrypt(privateKey, Buffer.from(encryptedMessage, 'base64')).toString('utf8');
    }
    
    static async clearKeys(room_id) {
        // Remove the key pair for the specified room_id
        const indexToRemove = purse.findIndex(pair => pair.room_id.toString() === room_id.toString());
        if (indexToRemove !== -1) {
            purse.splice(indexToRemove, 1);  // This will remove the item at the found index
        }
    
        await this.saveKeys();
    }

    static async saveKeys() {
        // Save the key pairs to a file
        const dataToWrite = {
            purse,
            timestamp: new Date().toISOString()  // Add timestamp
        };
        
        // Write the purse data with timestamp to the JSON file
        fs.writeFile('keys.json', JSON.stringify(dataToWrite, null, 2), (err) => {
            if (err) {
                console.error('Error writing purse data to file:', err);
            } else {
                console.log('Purse data with timestamp written successfully!');
            }
        });
    }

    static async loadKeys() {

        fs.readFile('keys.json', 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading purse data file:', err);
                return;
            }
        
            const parsedData = JSON.parse(data);
            const fileTimestamp = new Date(parsedData.timestamp);
            const currentTime = new Date();
        
            // Check if the file was written on a different day
            const isStale = currentTime.getDate() !== fileTimestamp.getDate() ||
                            currentTime.getMonth() !== fileTimestamp.getMonth() ||
                            currentTime.getFullYear() !== fileTimestamp.getFullYear();
        
            if (isStale) {
                // Clear the file if it's stale
                fs.writeFile('keys.json', JSON.stringify({ purse: [], timestamp: new Date().toISOString() }, null, 2), (clearErr) => {
                    if (clearErr) {
                        console.error('Error clearing stale purse data file:', clearErr);
                    } else {
                        console.log('Stale purse data file cleared.');
                        
                        purse.length = 0;
                    }
                });
            } else {
                console.log('Purse data read from file:', parsedData.purse);
                purse.splice(0, purse.length, ...parsedData.purse);
            }
        });
    }

    static async showKeys() {
        // Show the key pairs in the purse array
        console.log('Purse data:', purse);
    }

    static async clearAllKeys() {
        // Clear all key pairs from the purse array
        purse.length = 0;
        await this.saveKeys();
    }


}

module.exports = E2EE;
