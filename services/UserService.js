// services/UserService.js - 用户服务
const RoomService = require('./RoomService');
const User = require('../models/User');
const Logger = require('../utils/logger');

// 直接访问 RoomService 内部的 rooms 和 users
// 注意：这里使用解构赋值，需要确保 RoomService 导出了这些变量
const { rooms, users } = require('./RoomService');

class UserService {
    // 发送心跳
    static sendHeartbeat(userId, roomId) {
        const roomResult = RoomService.getRoomUsers(roomId, userId);
        
        if (!roomResult.success) {
            return roomResult;
        }
        
        // 更新用户活动时间
        if (users.has(userId)) {
            const user = users.get(userId);
            user.updateActivity();
        }
        
        return {
            success: true,
            code: 200,
            message: '心跳更新成功',
            data: {
                timestamp: new Date().toISOString()
            }
        };
    }

    // 获取所有用户
    static getAllUsers() {
        const allUsers = Array.from(users.values()).map(user => {
            // 获取用户所在房间的名称
            let roomName = null;
            if (user.roomId && rooms.has(user.roomId)) {
                roomName = rooms.get(user.roomId).roomName;
            }
            
            return {
                ...user.toJSON(),
                roomName: roomName
            };
        });
        
        return {
            success: true,
            code: 200,
            message: '查询成功',
            data: {
                count: allUsers.length,
                users: allUsers
            }
        };
    }

    // 获取单个用户
    static getUserById(userId) {
        if (!users.has(userId)) {
            return {
                success: false,
                code: 404,
                message: '用户不存在',
                data: null
            };
        }
        
        const user = users.get(userId);
        
        // 获取用户所在房间的名称
        let roomName = null;
        if (user.roomId && rooms.has(user.roomId)) {
            roomName = rooms.get(user.roomId).roomName;
        }
        
        return {
            success: true,
            code: 200,
            message: '查询成功',
            data: {
                ...user.toJSON(),
                roomName: roomName
            }
        };
    }

    // 新增用户
    static createUser(userId, nickname, roomId = null, type = 'user', status = 'active', avatar = null) {
        if (users.has(userId)) {
            return {
                success: false,
                code: 409,
                message: '用户已存在',
                data: null
            };
        }
        
        // 创建新用户
        const user = new User(userId, nickname, roomId, type, status, avatar);
        users.set(userId, user);
        
        // 如果指定了房间，并且房间存在，将用户加入房间
        if (roomId && rooms.has(roomId)) {
            const room = rooms.get(roomId);
            room.addUser(user);
        }
        
        Logger.info(`新增用户: ${userId}, 昵称: ${nickname}, 类型: ${type}`);
        
        return {
            success: true,
            code: 201,
            message: '用户创建成功',
            data: {
                ...user.toJSON(),
                roomName: roomId && rooms.has(roomId) ? rooms.get(roomId).roomName : null
            }
        };
    }

    // 更新用户信息
    static updateUser(userId, updates) {
        if (!users.has(userId)) {
            return {
                success: false,
                code: 404,
                message: '用户不存在',
                data: null
            };
        }
        
        const user = users.get(userId);
        const oldRoomId = user.roomId;
        
        // 更新用户信息
        user.updateInfo(updates);
        
        // 如果房间ID发生变化，处理房间转移
        if (updates.roomId && updates.roomId !== oldRoomId) {
            // 从旧房间移除用户
            if (oldRoomId && rooms.has(oldRoomId)) {
                const oldRoom = rooms.get(oldRoomId);
                oldRoom.removeUser(userId);
            }
            
            // 加入新房间
            if (updates.roomId && rooms.has(updates.roomId)) {
                const newRoom = rooms.get(updates.roomId);
                newRoom.addUser(user);
            }
        }
        
        // 获取用户所在房间的名称
        let roomName = null;
        if (user.roomId && rooms.has(user.roomId)) {
            roomName = rooms.get(user.roomId).roomName;
        }
        
        Logger.info(`更新用户信息: ${userId}, 更新内容: ${JSON.stringify(updates)}`);
        
        return {
            success: true,
            code: 200,
            message: '用户信息更新成功',
            data: {
                ...user.toJSON(),
                roomName: roomName
            }
        };
    }

    // 删除用户
    static deleteUser(userId) {
        if (!users.has(userId)) {
            return {
                success: false,
                code: 404,
                message: '用户不存在',
                data: null
            };
        }
        
        const user = users.get(userId);
        const roomId = user.roomId;
        
        // 从房间中移除用户
        if (roomId && rooms.has(roomId)) {
            const room = rooms.get(roomId);
            room.removeUser(userId);
        }
        
        // 从全局用户映射中删除用户
        users.delete(userId);
        
        Logger.info(`删除用户: ${userId}`);
        
        return {
            success: true,
            code: 200,
            message: '用户删除成功',
            data: {
                userId: userId
            }
        };
    }
}

module.exports = UserService;