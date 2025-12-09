// middlewares/errorHandler.js - 错误处理中间件
const Logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    Logger.error(`未捕获的错误: ${err.message}`);
    Logger.error(`错误堆栈: ${err.stack}`);
    
    res.status(500).json({
        success: false,
        code: 500,
        message: '服务器内部错误',
        data: null
    });
};

module.exports = errorHandler;