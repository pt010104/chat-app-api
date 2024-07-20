const { google } = require('googleapis');
const { getOAuth2Client } = require('../configs/oauth2.config');
const { getTemplate } = require('./template.service');
const { NotFoundError } = require('../core/error.response');
const { newOTP } = require('./otp.service');

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
        return result;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}

module.exports = { sendEmailOTP };
