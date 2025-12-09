// routes/index.js - 路由索引
const express = require('express');
const router = express.Router();
const roomRoutes = require('./roomRoutes');
const userRoutes = require('./userRoutes');

// API路由
router.use('/room', roomRoutes);
router.use('/user', userRoutes);

// 健康检查
router.get('/health', (req, res) => {
    const RoomService = require('../services/RoomService');
    
    const stats = RoomService.getStats();
    
    res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats: stats
    });
});

// 根路径
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: '房间服务器运行正常 (HTTPS)',
        version: '1.1.0',
        endpoints: {
            createRoom: 'POST /api/room/create',
            joinRoom: 'POST /api/room/join',
            getRoomUsers: 'GET /api/room/:roomId/users',
            leaveRoom: 'POST /api/room/leave',
            getRooms: 'GET /api/room/rooms or /api/room',
            getRoomInfo: 'GET /api/room/:roomId',
            updateMediaConfig: 'PUT /api/room/:roomId/media-config',
            disbandRoom: 'DELETE /api/room/:roomId',
            heartbeat: 'POST /api/user/heartbeat',
            updateUser: 'PUT /api/user/:userId',
            healthCheck: 'GET /api/health'
        }
    });
});

// 404处理
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        code: 404,
        message: 'API端点不存在',
        data: null
    });
});

module.exports = router;