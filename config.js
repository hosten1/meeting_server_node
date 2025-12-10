// config.js - 配置文件
const path = require('path');

const CONFIG = {
    // 服务器配置
    PORT: process.env.PORT || 5349,
    HOST: process.env.HOST || '0.0.0.0',
    SERVER: {
        URL: process.env.SERVER_URL || 'https://8.137.17.218:5349'
    },
    
    // 日志配置
    LOGGING: {
        ENABLED: true,
        LEVEL: process.env.LOG_LEVEL || 'info',
        FILE_PATH: path.join(__dirname, 'logs', 'server.log'),
        MAX_SIZE: '10m',
        MAX_FILES: '7d'
    },
    
    // CORS配置
    CORS: {
        ORIGIN: process.env.CORS_ORIGIN || "*",
        METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
        CREDENTIALS: true
    },
    
    // 房间配置
    ROOM: {
        MAX_USERS_PER_ROOM: 50,
        CLEANUP_INTERVAL: 10 * 60 * 1000, // 10分钟
        OFFLINE_TIMEOUT: 30 * 60 * 1000,  // 30分钟
        ROOM_IDLE_TIMEOUT: 60 * 60 * 1000 // 1小时
    },
    
    // SSL配置
    SSL: {
        KEY_PATH: path.join(__dirname, 'certs', 'key.pem'),
        CERT_PATH: path.join(__dirname, 'certs', 'cert.pem')
    },
    
    // 环境
    NODE_ENV: process.env.NODE_ENV || 'development',
    DEBUG: process.env.DEBUG || false
};

module.exports = CONFIG;