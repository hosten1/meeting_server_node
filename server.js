// server.js - 主服务器文件
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置和工具
const CONFIG = require('./config');
const Logger = require('./utils/logger');
const Cleaner = require('./utils/cleaner');

// 路由
const apiRoutes = require('./routes');

// 服务
const SocketService = require('./services/SocketService');

// 中间件
const multer = require('multer');

const app = express();

// 读取 SSL 证书
const privateKey = fs.readFileSync(CONFIG.SSL.KEY_PATH, 'utf8');
const certificate = fs.readFileSync(CONFIG.SSL.CERT_PATH, 'utf8');
const credentials = { key: privateKey, cert: certificate };

// 创建 HTTPS 服务器
const server = https.createServer(credentials, app);

// 初始化 Socket.IO 服务
SocketService.initialize(server);

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'public', 'avatars');
        // 确保目录存在
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一的文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'avatar-' + uniqueSuffix + ext);
    }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
    // 只允许图片文件
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('只允许上传图片文件（JPEG、PNG、GIF）'));
    }
};

// 创建multer实例
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter: fileFilter
});

// 添加multer到全局，以便在控制器中使用
app.use(upload.any());

// 静态文件服务 - 提供 public 目录下的文件
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        // 为HTML文件设置正确的Content-Type
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
        // 为JavaScript文件设置正确的Content-Type
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
    }
}));


// CORS 中间件
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', CONFIG.CORS.ORIGIN);
    res.header('Access-Control-Allow-Methods', CONFIG.CORS.METHODS.join(','));
    res.header('Access-Control-Allow-Headers', CONFIG.CORS.ALLOWED_HEADERS.join(','));
    res.header('Access-Control-Allow-Credentials', CONFIG.CORS.CREDENTIALS);
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// 请求日志中间件
app.use((req, res, next) => {
    Logger.info(`${req.method} ${req.url}`);
    next();
});

// API路由
app.use('/api', apiRoutes);

// 如果请求的文件不存在，默认返回 public 目录下的 index.html（用于单页应用）
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});

// 错误处理中间件
const errorHandler = require('./middlewares/errorHandler');
app.use(errorHandler);

// 启动清理任务
Cleaner.startCleanup();

// 启动 HTTPS 服务器
server.listen(CONFIG.PORT, CONFIG.HOST, () => {
    Logger.info(`HTTPS 服务器运行在 ${CONFIG.HOST}:${CONFIG.PORT}`);
    Logger.info(`API地址: https://8.137.17.218:${CONFIG.PORT}`);
    Logger.info(`静态文件: https://8.137.17.218:${CONFIG.PORT}`);
    Logger.info(`健康检查: https://8.137.17.218:${CONFIG.PORT}/api/health`);
});

// 优雅关闭
const shutdown = (signal) => {
    Logger.info(`收到 ${signal} 信号，正在关闭服务器...`);
    server.close(() => {
        Logger.info('服务器已关闭');
        process.exit(0);
    });
    
    // 5秒后强制退出
    setTimeout(() => {
        Logger.error('强制关闭服务器');
        process.exit(1);
    }, 5000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, server };