// services/RoomService.js - 房间服务
const Room = require('../models/Room');
const User = require('../models/User');
const MediaServiceConfig = require('../models/MediaServiceConfig');
const Logger = require('../utils/logger');
const EventEmitter = require('events');

// 内存存储
const rooms = new Map();
const users = new Map();

// 创建事件发射器实例
const eventEmitter = new EventEmitter();

// 房间服务类
class RoomService {
    // 暴露事件发射器的方法
    static on(event, listener) {
        eventEmitter.on(event, listener);
    }
    
    static emit(event, data) {
        eventEmitter.emit(event, data);
    }
    
    // 更新用户活动时间
    static updateUserActivity(userId) {
        if (users.has(userId)) {
            const user = users.get(userId);
            user.updateActivity();
            return {
                success: true,
                code: 200,
                message: '用户活动时间已更新',
                data: {
                    userId: userId,
                    lastActive: user.lastActive
                }
            };
        }
        return {
            success: false,
            code: 404,
            message: '用户不存在',
            data: null
        };
    }
    
    // 创建房间
    static createRoom(roomId, userId, nickname, roomName, mediaConfig) {
        // 检查房间是否已存在
        if (rooms.has(roomId)) {
            const existingRoom = rooms.get(roomId);
            return {
                success: false,
                code: 409,
                message: '房间已存在',
                data: {
                    roomId: roomId,
                    roomInfo: existingRoom.getRoomInfo(),
                    suggestion: '请使用其他房间ID，或直接加入该房间'
                }
            };
        }

        // 验证媒体服务配置
        const mediaValidation = MediaServiceConfig.validate(mediaConfig);
        if (!mediaValidation.valid) {
            return {
                success: false,
                code: 400,
                message: mediaValidation.error,
                data: null
            };
        }

        // 创建房间
        const room = new Room(roomId, roomName, userId, mediaValidation.config);
        rooms.set(roomId, room);
        
        // 创建用户（发起方自动加入）
        const user = new User(userId, nickname || userId, roomId);
        const success = room.addUser(user);
        
        if (!success) {
            // 理论上不应该发生，因为房间刚创建是空的
            rooms.delete(roomId);
            return {
                success: false,
                code: 500,
                message: '创建房间失败',
                data: null
            };
        }

        // 存储用户信息
        users.set(userId, user);
        
        // 发布房间创建事件
        eventEmitter.emit('roomCreated', room.getRoomInfo());
        
        return {
            success: true,
            code: 201,
            message: '房间创建成功',
            data: {
                userId: userId,
                userInfo: user.toJSON(),
                roomInfo: room.getRoomInfo()
            }
        };
    }

    // 加入房间
    static joinRoom(roomId, userId, nickname) {
        // 检查房间是否存在
        if (!rooms.has(roomId)) {
            return {
                success: false,
                code: 404,
                message: '房间不存在，请先创建房间',
                data: {
                    roomId: roomId,
                    suggestion: '使用 /api/room/create 接口创建房间'
                }
            };
        }

        const room = rooms.get(roomId);
        const existingUser = room.getAllUsers().find(u => u.userId === userId);
        
        if (existingUser) {
            // 用户重新连接
            existingUser.isOnline = true;
            existingUser.updateActivity();
            
            return {
                success: true,
                code: 200,
                message: '用户重新连接成功',
                data: {
                    userId: existingUser.userId,
                    userInfo: existingUser.toJSON(),
                    roomInfo: room.getRoomInfo()
                }
            };
        }

        // 新用户加入
        const user = new User(userId, nickname || userId, roomId);
        const success = room.addUser(user);
        
        if (!success) {
            return {
                success: false,
                code: 400,
                message: '加入房间失败（房间可能已满）',
                data: null
            };
        }

        users.set(userId, user);
        
        return {
            success: true,
            code: 200,
            message: '加入房间成功',
            data: {
                userId: userId,
                userInfo: user.toJSON(),
                roomInfo: room.getRoomInfo()
            }
        };
    }

    // 离开房间
    static leaveRoom(roomId, userId) {
        if (!rooms.has(roomId)) {
            return {
                success: false,
                code: 404,
                message: '房间不存在',
                data: null
            };
        }

        const room = rooms.get(roomId);
        const success = room.removeUser(userId);
        
        if (!success) {
            return {
                success: false,
                code: 404,
                message: '用户不在该房间中',
                data: null
            };
        }

        if (users.has(userId)) {
            const user = users.get(userId);
            user.isOnline = false;
            user.updateActivity();
        }

        // 如果房间为空，清理房间（可选）
        if (room.userCount === 0) {
            // 可以选择保留房间一段时间，或者删除
            // rooms.delete(roomId);
        }

        return {
            success: true,
            code: 200,
            message: '离开房间成功',
            data: {
                roomInfo: room.getRoomInfo()
            }
        };
    }

    // 查询房间用户
    static getRoomUsers(roomId, userId = null) {
        if (!rooms.has(roomId)) {
            return {
                success: false,
                code: 404,
                message: '房间不存在',
                data: null
            };
        }

        const room = rooms.get(roomId);
        let userList = room.getAllUsers();

        Logger.info(`房间 ${room} 用户列表: ${userList}`);
        
        if (userId) {
            const user = userList.find(u => u.userId === userId);
            if (user) {
                userList = [user];
            } else {
                return {
                    success: false,
                    code: 404,
                    message: '用户不在该房间中',
                    data: null
                };
            }
        }

        return {
            success: true,
            code: 200,
            message: '查询成功',
            data: {
                roomInfo: room.getRoomInfo(),
                userCount: userList.length,
                users: userList.map(user => user.toJSON())
            }
        };
    }

    // 获取所有房间
    static getAllRooms() {
        const roomList = Array.from(rooms.values()).map(room => room.getRoomInfo());
        
        return {
            success: true,
            code: 200,
            message: '查询成功',
            data: {
                count: roomList.length,
                rooms: roomList
            }
        };
    }

    // 获取房间信息
    static getRoomInfo(roomId) {
        if (!rooms.has(roomId)) {
            return {
                success: false,
                code: 404,
                message: '房间不存在',
                data: null
            };
        }

        const room = rooms.get(roomId);
        
        return {
            success: true,
            code: 200,
            message: '查询成功',
            data: room.getRoomInfo()
        };
    }

    // 更新媒体服务配置
    static updateMediaConfig(roomId, userId, mediaConfig) {
        if (!rooms.has(roomId)) {
            return {
                success: false,
                code: 404,
                message: '房间不存在',
                data: null
            };
        }

        const room = rooms.get(roomId);
        
        // 验证用户是否为房间创建者
        if (!room.isCreator(userId)) {
            return {
                success: false,
                code: 403,
                message: '只有房间创建者可以更新媒体服务配置',
                data: null
            };
        }

        // 验证媒体服务配置
        const mediaValidation = MediaServiceConfig.validate(mediaConfig);
        if (!mediaValidation.valid) {
            return {
                success: false,
                code: 400,
                message: mediaValidation.error,
                data: null
            };
        }

        // 更新媒体服务配置
        const updated = room.updateMediaConfig(mediaValidation.config);
        
        if (!updated) {
            return {
                success: false,
                code: 400,
                message: '更新媒体服务配置失败',
                data: null
            };
        }

        return {
            success: true,
            code: 200,
            message: '媒体服务配置更新成功',
            data: room.getRoomInfo()
        };
    }

    // 解散房间
    static disbandRoom(roomId, userId) {
        if (!rooms.has(roomId)) {
            return {
                success: false,
                code: 404,
                message: '房间不存在',
                data: null
            };
        }

        const room = rooms.get(roomId);
        
        // 验证用户是否为房间创建者或管理员
        if (!room.isCreator(userId) && userId !== 'admin') {
            return {
                success: false,
                code: 403,
                message: '只有房间创建者或管理员可以解散房间',
                data: null
            };
        }

        // 清理房间中的所有用户
        room.getAllUsers().forEach(user => {
            if (users.has(user.userId)) {
                // 从全局用户映射中删除用户，彻底清除关联
                users.delete(user.userId);
            }
        });

        // 删除房间
        rooms.delete(roomId);
        
        // 发布房间解散事件
        eventEmitter.emit('roomDisbanded', {
            roomId: roomId,
            disbandedAt: new Date()
        });
        
        return {
            success: true,
            code: 200,
            message: '房间解散成功',
            data: {
                roomId: roomId,
                disbandedAt: new Date()
            }
        };
    }

    // 获取统计信息
    static getStats() {
        const totalUsers = users.size;
        const onlineUsers = Array.from(users.values()).filter(u => u.isOnline).length;
        const totalRooms = rooms.size;
        const activeRooms = Array.from(rooms.values()).filter(r => r.isActive).length;
        
        return {
            rooms: totalRooms,
            totalUsers: totalUsers,
            onlineUsers: onlineUsers,
            activeRooms: activeRooms
        };
    }

    // 清理离线用户
    static cleanupOfflineUsers(offlineTimeout) {
        const now = new Date();
        let cleanedCount = 0;
        
        for (const [roomId, room] of rooms.entries()) {
            const offlineUsers = room.getAllUsers().filter(user => {
                return now - user.lastActive > offlineTimeout;
            });
            
            offlineUsers.forEach(user => {
                room.removeUser(user.userId);
                cleanedCount++;
            });
        }
        
        return cleanedCount;
    }

    // 清理空闲房间
    static cleanupIdleRooms(idleTimeout) {
        const now = new Date();
        let removedRooms = 0;
        
        for (const [roomId, room] of rooms.entries()) {
            if (room.userCount === 0) {
                const idleTime = now - room.lastActive;
                if (idleTime > idleTimeout) {
                    rooms.delete(roomId);
                    removedRooms++;
                }
            }
        }
        
        return removedRooms;
    }
}

module.exports = RoomService;