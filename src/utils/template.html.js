'use strict'

const htmlEmailToken = () => {
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
            height: 100px;
            border-radius: 50%; /* Makes the image round */
        }
        .content {
            padding: 45px;
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
            <h1>Xác thực Email</h1>
            <p>Chào bạn,</p>
            <p>Bạn gần như đã sẵn sàng để bắt đầu sử dụng ứng dụng Chat App. Vui lòng kiểm tra mã OTP dưới đây để xác thực địa chỉ email của bạn và bắt đầu. Mã này hết hạn sau 2 phút.</p>
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

module.exports = { htmlEmailToken };
