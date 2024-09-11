const isDev = process.env.NODE_ENV === 'dev';

const QueueNames = {
    CHAT_MESSAGES: `chat_messages${isDev ? '_test' : ''}`,
    IMAGE_MESSAGES: `image_messages${isDev ? '_test' : ''}`,
    GIFT_MESSAGES: `gift_messages${isDev ? '_test' : ''}`,
    EDIT_MESSAGES: `edit_messages`,
    DELETE_MESSAGES: `delete_messages`,
};

module.exports = QueueNames;
