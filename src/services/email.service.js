const { google } = require('googleapis');
const { getOAuth2Client } = require('../configs/oauth2.config');
const { getTemplate } = require('./template.service');
const { NotFoundError } = require('../core/error.response');
const { newOTP } = require('./otp.service');

async function sendEmailOTP(to, type) {
    const oAuth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    const otp = await newOTP({email: to, type});

    const Subject = type === 'new-user' ? 'Xác thực Email' : 'Đặt lại mật khẩu'
    const templateName = type === 'new-user' ? 'NEW_USER_OTP' : 'RESET_PASSWORD_OTP';
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
        console.log('Email sent:', result);
        return result;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}

module.exports = { sendEmailOTP };
