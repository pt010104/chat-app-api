const isDev = process.env.NODE_ENV === 'dev';

const QueueNames = {
    CHAT_MESSAGES: `chat_messages${isDev ? '_test' : ''}`,
    IMAGE_MESSAGES: `image_messages${isDev ? '_test' : ''}`,
    GIFT_MESSAGES: `gift_messages${isDev ? '_test' : ''}`,
    PRIVATE_CHAT_MESSAGES: 'private_chat_messages',
    RESET_ROOM : 'reset_room'
};

module.exports = QueueNames;
