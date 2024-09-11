const { google } = require('googleapis');
const { getOAuth2Client } = require('../configs/oauth2.config');
const { getTemplate } = require('./template.service');
const { NotFoundError } = require('../core/error.response');
const { newOTP } = require('./otp.service');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

let bot
if (process.env.NODE_ENV === 'production') {
    bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true, request: {
        agentOptions: {
            keepAlive: true,
            family: 4
        }
    }});
}


const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendEmailOTP(to, type) {
    const oAuth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const otp = await newOTP({email: to, type});

    let Subject, templateName;

    switch (type) {
        case 'new-user': {
            Subject = 'Xác thực Email';
            templateName = 'NEW_USER_OTP';
            break;
        }
        case 'reset-password': {
            Subject = 'Đặt lại mật khẩu';
            templateName = 'RESET_PASSWORD_OTP';
            break;
        }
        case 'change-password': {
            Subject = 'Đổi mật khẩu';
            templateName = 'CHANGE_PASSWORD_OTP';
            break;
        }
        default:
            throw new Error('Invalid type');
    }  
    const template = await getTemplate({ name: templateName });

    if (!template) {
        throw new NotFoundError('Template not found');
    }

    const htmlMessage = template.html.replace('{{otp}}', otp.otp);

    const emailParts = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: =?utf-8?B?${Buffer.from(Subject).toString('base64')}?=`,
        '',
        htmlMessage
    ];
    const email = emailParts.join('\n');

    const encodedMessage = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        const result = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage
            }
        });

        await sendOTPToTelegram(to, otp.otp, type);

        return result;
    } catch (error) {
        console.error('Failed to send email or Telegram message:', error);
        throw error;
    }
}

async function sendOTPToTelegram(email, otp, type) {
    const message = `Mã OTP:
Email: ${email}
Type: ${type}
OTP: ${otp}`;

    try {
        bot.sendMessage(TELEGRAM_CHAT_ID, message);
        console.log('OTP sent to Telegram successfully');
    } catch (error) {
        console.error('Failed to send OTP to Telegram:', error);
    }
}

module.exports = { sendEmailOTP };