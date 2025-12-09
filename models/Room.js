// models/Room.js - 房间模型
const MediaServiceConfig = require('./MediaServiceConfig');

class Room {
    constructor(roomId, roomName, creator, mediaConfig) {
        this.roomId = roomId;
        this.roomName = roomName || `Room-${roomId}`;
        this.creator = creator;
        this.createdAt = new Date();
        this.users = new Map();
        this.userCount = 0;
        this.maxUsers = 50; // 默认值，实际从配置读取
        
        // 房间媒体服务配置（由发起方传入）
        this.mediaConfig = mediaConfig || new MediaServiceConfig(
            'localhost',
            6000,
            'https'
        );
        
        // 房间状态
        this.isActive = true;
        this.lastActive = new Date();
    }

    addUser(user) {
        if (this.users.has(user.userId)) return false;
        if (this.userCount >= this.maxUsers) return false;
        this.users.set(user.userId, user);
        this.userCount++;
        this.updateActivity();
        return true;
    }

    removeUser(userId) {
        if (this.users.has(userId)) {
            this.users.delete(userId);
            this.userCount--;
            this.updateActivity();
            return true;
        }
        return false;
    }

    getUser(userId) {
        return this.users.get(userId);
    }

    getAllUsers() {
        return Array.from(this.users.values());
    }
    
    // 更新房间活动时间
    updateActivity() {
        this.lastActive = new Date();
    }
    
    // 更新媒体服务配置
    updateMediaConfig(mediaConfig) {
        if (mediaConfig) {
            this.mediaConfig = mediaConfig;
            this.updateActivity();
            return true;
        }
        return false;
    }
    
    // 检查用户是否是创建者
    isCreator(userId) {
        return this.creator === userId;
    }

    getRoomInfo() {
        return {
            roomId: this.roomId,
            roomName: this.roomName,
            creator: this.creator,
            createdAt: this.createdAt,
            userCount: this.userCount,
            maxUsers: this.maxUsers,
            isActive: this.isActive,
            lastActive: this.lastActive,
            mediaConfig: this.mediaConfig.toJSON()
        };
    }
}

module.exports = Room;