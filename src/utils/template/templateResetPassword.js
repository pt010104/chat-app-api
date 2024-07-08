'use strict'

const htmlResetPassword = () => {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: #333;
        }
        .email-container {
            background-color: white;
            width: 80%;
            max-width: 600px;
            margin: 20px auto;
            border: 1px solid #ddd;
            padding: 20px;
        }
        .header {
            background-color: #3498db;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .header img {
            height: 130px;
            border-radius: 50%; /* Làm cho hình tròn */
        }
        .content {
            padding: 65px;
            text-align: center;
        }
        .button {
            background-color: #3498db;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            display: inline-block;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="https://media.istockphoto.com/id/1410274315/vector/unread-message-pixel-perfect-gradient-linear-ui-icon.jpg?s=612x612&w=0&k=20&c=jSsnpx0FBBgvbWMH9_3a9-ZzZLwXIGuJKRA1qt8KTdY=" alt="Logo" style="height: 60px;">
        </div>
        <div class="content">
            <h1>Đặt lại mật khẩu của bạn</h1>
            <p>Chào bạn,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã OTP dưới đây để đặt lại mật khẩu của bạn. Mã này sẽ hết hạn sau 2 phút.</p>
            <span class="button">{{otp}}</span>
        </div>
        <div class="footer">
            Nếu bạn không yêu cầu email này, vui lòng bỏ qua nó.
        </div>
    </div>
</body>
</html>
    `;
}

module.exports = { htmlResetPassword };
