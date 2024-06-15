const { google } = require('googleapis');
const { getOAuth2Client } = require('../configs/oauth2.config');

async function sendEmail(to, subject, otp) {
    const oAuth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Email HTML
    const htmlMessage = `
    <div style="font-family: 'Arial', sans-serif; color: #333;">
        <h2 style="color: #598DFA;">Chat App</h2>
        <p>Xin chào,</p>
        <p>Đây là mã xác thực Chat App của bạn. Mã có hiệu lực trong vòng 5 phút:</p>
        <div style="background-color: #f2f2f2; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
            ${otp}
        </div>
        <p>Trân trọng,<br>Thịnh đz</p>
    </div>`;

    const emailParts = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
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


module.exports = { sendEmail };
