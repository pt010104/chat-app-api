const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../../credentials', 'credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../credentials', 'token.json');

function getOAuth2Client() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
    const { client_secret, client_id, redirect_uris } = credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    try {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
        oAuth2Client.setCredentials(token);
    } catch (error) {
        console.log('Token not found or invalid. You need to re-authorize this application.');
    }

    return oAuth2Client;
}

module.exports = { getOAuth2Client };
