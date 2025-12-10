// models/User.js - 用户模型
class User {
    constructor(userId, nickname, roomId, type = 'user', status = 'active', avatar = null) {
        this.userId = userId;
        this.nickname = nickname || userId;
        this.roomId = roomId;
        this.type = type; // user or admin
        this.status = status; // active or inactive
        this.avatar = avatar;
        this.joinedAt = new Date();
        this.createdAt = new Date();
        this.isOnline = true;
        this.lastActive = new Date();
    }

    updateActivity() {
        this.lastActive = new Date();
    }

    updateInfo(updates) {
        if (updates.nickname) {
            this.nickname = updates.nickname;
        }
        if (updates.roomId !== undefined) {
            this.roomId = updates.roomId;
        }
        if (updates.type) {
            this.type = updates.type;
        }
        if (updates.status) {
            this.status = updates.status;
        }
        if (updates.avatar) {
            this.avatar = updates.avatar;
        }
        this.updateActivity();
    }

    toJSON() {
        return {
            userId: this.userId,
            nickname: this.nickname,
            roomId: this.roomId,
            type: this.type,
            status: this.status,
            avatar: this.avatar,
            joinedAt: this.joinedAt,
            createdAt: this.createdAt,
            isOnline: this.isOnline,
            lastActive: this.lastActive
        };
    }
}

module.exports = User;