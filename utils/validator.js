// utils/validator.js - 验证工具
class Validator {
    static validateRequiredFields(fields, data) {
        const missing = [];
        fields.forEach(field => {
            if (!data[field]) missing.push(field);
        });
        return missing;
    }

    static validateString(value, fieldName) {
        if (typeof value !== 'string' || value.trim().length === 0) {
            return `${fieldName}必须是有效字符串`;
        }
        return null;
    }

    static validatePort(port) {
        const portNum = parseInt(port, 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
            return '端口必须在1-65535之间';
        }
        return null;
    }

    static validateRoomId(roomId) {
        return this.validateString(roomId, '房间ID');
    }

    static validateUserId(userId) {
        return this.validateString(userId, '用户ID');
    }

    static validateNickname(nickname) {
        if (nickname && typeof nickname !== 'string') {
            return '昵称必须是字符串';
        }
        return null;
    }
}

module.exports = Validator;