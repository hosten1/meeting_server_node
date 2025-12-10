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

// 重启服务（仅开发环境可用）
router.post('/restart', (req, res) => {
    const { spawn } = require('child_process');
    
    // 检查是否为开发环境
    if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
            success: false,
            code: 403,
            message: '此接口仅在开发环境可用',
            data: null
        });
    }
    
    res.status(200).json({
        success: true,
        message: '服务重启请求已接收，正在重启...',
        data: null
    });
    
    // 执行重启脚本
    const restartScript = spawn('bash', ['restart-server.sh'], {
        detached: true,
        stdio: 'inherit'
    });
    
    // 退出当前进程
    setTimeout(() => {
        process.exit(0);
    }, 1000);
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

// 日志查看
router.get('/logs', (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const CONFIG = require('../config');
    
    try {
        const logFilePath = CONFIG.LOGGING.FILE_PATH;
        const level = req.query.level || 'all';
        
        // 检查日志文件是否存在
        if (!fs.existsSync(logFilePath)) {
            return res.status(200).json({
                success: true,
                code: 200,
                message: '日志文件不存在',
                data: {
                    logs: []
                }
            });
        }
        
        // 读取日志文件
        const logs = fs.readFileSync(logFilePath, 'utf8');
        const logLines = logs.split('\n').filter(line => line.trim() !== '');
        
        // 解析日志行
        const parsedLogs = logLines.map(line => {
            // 解析日志格式：[2023-12-10T03:15:19.306Z] [INFO] Socket.IO服务已初始化
            const match = line.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\] \[(\w+)\] (.*?): (.*)/);
            if (match) {
                return {
                    time: match[1],
                    level: match[2],
                    module: match[3],
                    action: '',
                    detail: match[4]
                };
            }
            // 如果解析失败，返回原始行
            return {
                time: new Date().toISOString(),
                level: 'INFO',
                module: 'Unknown',
                action: '',
                detail: line
            };
        });
        
        // 过滤日志级别
        let filteredLogs = parsedLogs;
        if (level !== 'all') {
            filteredLogs = parsedLogs.filter(log => log.level === level);
        }
        
        // 只返回最近的1000条日志
        const recentLogs = filteredLogs.slice(-1000);
        
        return res.status(200).json({
            success: true,
            code: 200,
            message: '日志获取成功',
            data: {
                logs: recentLogs
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            code: 500,
            message: '读取日志失败',
            data: null
        });
    }
});

// 清空日志
router.delete('/logs', (req, res) => {
    const fs = require('fs');
    const CONFIG = require('../config');
    
    try {
        const logFilePath = CONFIG.LOGGING.FILE_PATH;
        
        // 清空日志文件
        fs.writeFileSync(logFilePath, '', 'utf8');
        
        return res.status(200).json({
            success: true,
            code: 200,
            message: '日志清空成功',
            data: null
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            code: 500,
            message: '清空日志失败',
            data: null
        });
    }
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