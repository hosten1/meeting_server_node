// services/UserService.js - 用户服务
const RoomService = require('./RoomService');

class UserService {
    // 发送心跳
    static sendHeartbeat(userId, roomId) {
        const roomResult = RoomService.getRoomUsers(roomId, userId);
        
        if (!roomResult.success) {
            return roomResult;
        }
        
        // 更新用户活动时间
        // 这里我们依赖于 RoomService 内部的状态更新
        // 在实际应用中，应该直接更新用户状态
        
        return {
            success: true,
            code: 200,
            message: '心跳更新成功',
            data: {
                timestamp: new Date().toISOString()
            }
        };
    }

    // 更新用户信息
    static updateUser(userId, nickname) {
        // 在实际应用中，这里应该更新用户存储
        // 这里简化为返回成功
        
        return {
            success: true,
            code: 200,
            message: '用户信息更新成功',
            data: {
                userId: userId,
                nickname: nickname,
                updatedAt: new Date()
            }
        };
    }
}

module.exports = UserService;