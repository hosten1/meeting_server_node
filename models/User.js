// models/User.js - 用户模型
class User {
    constructor(userId, nickname, roomId) {
        this.userId = userId;
        this.nickname = nickname || userId;
        this.roomId = roomId;
        this.joinedAt = new Date();
        this.isOnline = true;
        this.lastActive = new Date();
    }

    updateActivity() {
        this.lastActive = new Date();
    }

    toJSON() {
        return {
            userId: this.userId,
            nickname: this.nickname,
            roomId: this.roomId,
            joinedAt: this.joinedAt,
            isOnline: this.isOnline,
            lastActive: this.lastActive
        };
    }
}

module.exports = User;