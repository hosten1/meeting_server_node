// services/SocketService.js - Socket.IO 服务管理
const socketio = require('socket.io');
const EventEmitter = require('events');
const Logger = require('../utils/logger');
const RoomService = require('./RoomService');

// 创建事件发射器
const eventEmitter = new EventEmitter();

// 用户socket管理类
class UserSocket {
    constructor(socket) {
        this.socket = socket;
        this.userId = null;
        this.roomId = null;
        this.nickname = null;
        this.isOnline = true;
        this.createdAt = new Date();
        this.lastActive = new Date();
    }
    
    // 设置用户信息
    setUserInfo(userId, roomId, nickname) {
        this.userId = userId;
        this.roomId = roomId;
        this.nickname = nickname;
        this.updateActivity();
    }
    
    // 更新活动时间
    updateActivity() {
        this.lastActive = new Date();
    }
    
    // 发送消息
    send(event, data) {
        this.socket.emit(event, data);
    }
    
    // 加入房间
    joinRoom(roomId) {
        this.socket.join(roomId);
        this.roomId = roomId;
    }
    
    // 离开房间
    leaveRoom() {
        if (this.roomId) {
            this.socket.leave(this.roomId);
            this.roomId = null;
        }
    }
    
    // 断开连接
    disconnect() {
        this.isOnline = false;
        this.leaveRoom();
    }
    
    // 获取用户信息
    getUserInfo() {
        return {
            userId: this.userId,
            roomId: this.roomId,
            nickname: this.nickname,
            isOnline: this.isOnline,
            createdAt: this.createdAt,
            lastActive: this.lastActive
        };
    }
}

// 房间socket管理类
class RoomSocketManager {
    constructor() {
        this.rooms = new Map(); // roomId => Set<UserSocket>
    }
    
    // 添加用户到房间
    addUserToRoom(roomId, userSocket) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId).add(userSocket);
    }
    
    // 从房间移除用户
    removeUserFromRoom(roomId, userSocket) {
        if (this.rooms.has(roomId)) {
            this.rooms.get(roomId).delete(userSocket);
            // 如果房间为空，删除房间
            if (this.rooms.get(roomId).size === 0) {
                this.rooms.delete(roomId);
            }
        }
    }
    
    // 广播消息到房间
    broadcastToRoom(roomId, event, data, excludeSocket = null) {
        if (this.rooms.has(roomId)) {
            this.rooms.get(roomId).forEach(userSocket => {
                if (excludeSocket && userSocket.socket.id === excludeSocket.id) {
                    return;
                }
                userSocket.send(event, data);
            });
        }
    }
    
    // 获取房间内的所有用户
    getRoomUsers(roomId) {
        if (this.rooms.has(roomId)) {
            return Array.from(this.rooms.get(roomId), userSocket => userSocket.getUserInfo());
        }
        return [];
    }
    
    // 获取房间内的socket数量
    getRoomSocketCount(roomId) {
        if (this.rooms.has(roomId)) {
            return this.rooms.get(roomId).size;
        }
        return 0;
    }
    
    // 清理房间
    cleanupRoom(roomId) {
        this.rooms.delete(roomId);
    }
}

// Socket.IO服务类
class SocketService {
    constructor() {
        this.io = null;
        this.userSockets = new Map(); // socket.id => UserSocket
        this.roomSocketManager = new RoomSocketManager();
        this.isInitialized = false;
    }
    
    // 初始化Socket.IO服务
    initialize(server) {
        if (this.isInitialized) {
            Logger.warn('SocketService已经初始化');
            return;
        }
        
        this.io = socketio(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                credentials: true
            },
            allowEIO3: true // 兼容Socket.IO v3客户端
        });
        
        this.setupEventHandlers();
        this.setupRoomEventListeners();
        
        this.isInitialized = true;
        Logger.info('Socket.IO服务已初始化');
    }
    
    // 设置socket事件处理
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            Logger.info(`客户端已连接: ${socket.id}`);
            
            // 创建用户socket实例
            const userSocket = new UserSocket(socket);
            this.userSockets.set(socket.id, userSocket);
            
            // 监听断开连接事件
            socket.on('disconnect', () => {
                this.handleDisconnect(userSocket);
            });
            
            // 监听创建房间事件
            socket.on('createRoom', (data) => {
                this.handleCreateRoom(userSocket, data);
            });
            
            // 监听加入房间事件
            socket.on('joinRoom', (data) => {
                this.handleJoinRoom(userSocket, data);
            });
            
            // 监听离开房间事件
            socket.on('leaveRoom', (data) => {
                this.handleLeaveRoom(userSocket, data);
            });
            
            // 监听获取房间列表事件
            socket.on('getRooms', () => {
                this.handleGetRooms(userSocket);
            });
            
            // 监听获取房间用户事件
            socket.on('getRoomUsers', (data) => {
                this.handleGetRoomUsers(userSocket, data);
            });
            
            // 监听解散房间事件
            socket.on('disbandRoom', (data) => {
                this.handleDisbandRoom(userSocket, data);
            });
            
            // 监听心跳事件
            socket.on('heartbeat', (data) => {
                this.handleHeartbeat(userSocket, data);
            });
            
            // 监听自定义消息事件
            socket.on('message', (data) => {
                this.handleMessage(userSocket, data);
            });
        });
    }
    
    // 设置房间事件监听
    setupRoomEventListeners() {
        // 监听房间创建事件
        RoomService.on('roomCreated', (roomInfo) => {
            this.io.emit('roomCreated', roomInfo);
        });
        
        // 监听房间解散事件
        RoomService.on('roomDisbanded', (roomInfo) => {
            this.io.to(roomInfo.roomId).emit('roomDisbanded', roomInfo);
        });
    }
    
    // 处理连接断开
    handleDisconnect(userSocket) {
        Logger.info(`客户端已断开连接: ${userSocket.socket.id}`);
        
        // 更新用户状态
        userSocket.disconnect();
        
        // 如果用户在房间中，广播用户离开
        if (userSocket.roomId) {
            this.roomSocketManager.broadcastToRoom(userSocket.roomId, 'userLeft', {
                userId: userSocket.userId,
                timestamp: new Date().toISOString()
            });
            
            // 从房间中移除用户
            this.roomSocketManager.removeUserFromRoom(userSocket.roomId, userSocket);
        }
        
        // 从用户列表中移除
        this.userSockets.delete(userSocket.socket.id);
    }
    
    // 处理创建房间
    async handleCreateRoom(userSocket, data) {
        const { roomId, userId, nickname, roomName, mediaConfig } = data;
        
        try {
            // 使用RoomService处理创建房间
            const result = await RoomService.createRoom(roomId, userId, nickname, roomName, mediaConfig || {});
            
            if (result.success) {
                // 设置用户信息
                userSocket.setUserInfo(userId, roomId, nickname);
                
                // 加入房间
                userSocket.joinRoom(roomId);
                this.roomSocketManager.addUserToRoom(roomId, userSocket);
                
                // 发送创建结果
                userSocket.send('createRoomResult', result);
                
                Logger.info(`用户 ${userId} 创建了房间 ${roomId}`);
            } else {
                // 发送失败结果
                userSocket.send('createRoomResult', result);
            }
        } catch (error) {
            Logger.error(`处理创建房间事件失败: ${error.message}`);
            userSocket.send('createRoomResult', {
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }
    
    // 处理加入房间
    async handleJoinRoom(userSocket, data) {
        const { roomId, userId, nickname } = data;
        
        try {
            // 使用RoomService处理加入房间
            const result = await RoomService.joinRoom(roomId, userId, nickname);
            
            if (result.success) {
                // 设置用户信息
                userSocket.setUserInfo(userId, roomId, nickname);
                
                // 加入房间
                userSocket.joinRoom(roomId);
                this.roomSocketManager.addUserToRoom(roomId, userSocket);
                
                // 发送加入结果
                userSocket.send('joinRoomResult', result);
                
                // 广播给房间内其他用户
                this.roomSocketManager.broadcastToRoom(roomId, 'userJoined', {
                    userId: userId,
                    nickname: nickname,
                    timestamp: new Date().toISOString()
                }, userSocket.socket);
                
                Logger.info(`用户 ${userId} 加入房间 ${roomId}`);
            } else {
                // 发送失败结果
                userSocket.send('joinRoomResult', result);
            }
        } catch (error) {
            Logger.error(`处理加入房间事件失败: ${error.message}`);
            userSocket.send('joinRoomResult', {
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }
    
    // 处理离开房间
    async handleLeaveRoom(userSocket, data) {
        const { roomId, userId } = data;
        
        try {
            // 使用RoomService处理离开房间
            const result = await RoomService.leaveRoom(roomId, userId);
            
            if (result.success) {
                // 离开房间
                userSocket.leaveRoom();
                this.roomSocketManager.removeUserFromRoom(roomId, userSocket);
                
                // 发送离开结果
                userSocket.send('leaveRoomResult', result);
                
                // 广播给房间内其他用户
                this.roomSocketManager.broadcastToRoom(roomId, 'userLeft', {
                    userId: userId,
                    timestamp: new Date().toISOString()
                });
                
                Logger.info(`用户 ${userId} 离开房间 ${roomId}`);
            } else {
                // 发送失败结果
                userSocket.send('leaveRoomResult', result);
            }
        } catch (error) {
            Logger.error(`处理离开房间事件失败: ${error.message}`);
            userSocket.send('leaveRoomResult', {
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }
    
    // 处理获取房间列表
    async handleGetRooms(userSocket) {
        try {
            // 使用RoomService获取房间列表
            const result = await RoomService.getAllRooms();
            userSocket.send('getRoomsResult', result);
        } catch (error) {
            Logger.error(`处理获取房间列表事件失败: ${error.message}`);
            userSocket.send('getRoomsResult', {
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }
    
    // 处理获取房间用户
    async handleGetRoomUsers(userSocket, data) {
        const { roomId } = data;
        
        try {
            // 使用RoomService获取房间用户
            const result = await RoomService.getRoomUsers(roomId);
            userSocket.send('getRoomUsersResult', result);
        } catch (error) {
            Logger.error(`处理获取房间用户事件失败: ${error.message}`);
            userSocket.send('getRoomUsersResult', {
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }
    
    // 处理解散房间
    async handleDisbandRoom(userSocket, data) {
        const { roomId, userId } = data;
        
        try {
            // 使用RoomService处理解散房间
            const result = await RoomService.disbandRoom(roomId, userId);
            
            if (result.success) {
                // 发送解散结果
                userSocket.send('disbandRoomResult', result);
                
                // 广播给房间内所有用户
                this.io.to(roomId).emit('roomDisbanded', {
                    roomId: roomId,
                    disbandedAt: new Date().toISOString()
                });
                
                // 清理房间内的所有用户
                const roomUsers = this.roomSocketManager.getRoomUsers(roomId);
                roomUsers.forEach(user => {
                    const socketUser = this.userSockets.get(user.socketId);
                    if (socketUser) {
                        socketUser.leaveRoom();
                    }
                });
                
                // 清理房间socket管理
                this.roomSocketManager.cleanupRoom(roomId);
                
                Logger.info(`房间 ${roomId} 已解散`);
            } else {
                // 发送失败结果
                userSocket.send('disbandRoomResult', result);
            }
        } catch (error) {
            Logger.error(`处理解散房间事件失败: ${error.message}`);
            userSocket.send('disbandRoomResult', {
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }
    
    // 处理心跳
    async handleHeartbeat(userSocket, data) {
        const { userId } = data;
        
        try {
            // 更新用户活动时间
            const result = await RoomService.updateUserActivity(userId);
            
            // 更新socket的活动时间
            if (userSocket.userId === userId) {
                userSocket.updateActivity();
            }
            
            userSocket.send('heartbeatResult', {
                success: true,
                message: '心跳成功',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            Logger.error(`处理心跳事件失败: ${error.message}`);
            userSocket.send('heartbeatResult', {
                success: false,
                message: '心跳失败',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // 处理自定义消息
    handleMessage(userSocket, data) {
        const { roomId, message } = data;
        
        if (roomId) {
            // 广播消息到房间
            this.roomSocketManager.broadcastToRoom(roomId, 'message', {
                userId: userSocket.userId,
                nickname: userSocket.nickname,
                message: message,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // 发送消息给指定用户
    sendToUser(userId, event, data) {
        // 查找对应的userSocket
        for (const [socketId, userSocket] of this.userSockets.entries()) {
            if (userSocket.userId === userId && userSocket.isOnline) {
                userSocket.send(event, data);
                return true;
            }
        }
        return false;
    }
    
    // 发送消息给房间内所有用户
    sendToRoom(roomId, event, data) {
        this.io.to(roomId).emit(event, data);
    }
    
    // 发送消息给所有用户
    sendToAll(event, data) {
        this.io.emit(event, data);
    }
    
    // 获取房间内的在线用户数
    getOnlineUsersCount(roomId) {
        return this.roomSocketManager.getRoomSocketCount(roomId);
    }
    
    // 获取所有在线用户数
    getAllOnlineUsersCount() {
        return this.userSockets.size;
    }
    
    // 暴露事件发射器方法
    static on(event, listener) {
        eventEmitter.on(event, listener);
    }
    
    static emit(event, data) {
        eventEmitter.emit(event, data);
    }
}

// 导出单例实例
const socketService = new SocketService();
module.exports = socketService;
