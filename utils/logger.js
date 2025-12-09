// utils/logger.js - 日志工具
const fs = require('fs');
const path = require('path');
const CONFIG = require('../config');

// 确保日志目录存在
const logDir = path.dirname(CONFIG.LOGGING.FILE_PATH);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

class Logger {
    static log(message, level = 'info') {
        if (!CONFIG.LOGGING.ENABLED) return;
        
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        // 控制台输出
        switch(level) {
            case 'error':
                console.error(logMessage);
                break;
            case 'warn':
                console.warn(logMessage);
                break;
            case 'debug':
                if (CONFIG.DEBUG) console.debug(logMessage);
                break;
            default:
                console.log(logMessage);
        }
        
        // 文件输出
        if (CONFIG.LOGGING.FILE_PATH) {
            try {
                fs.appendFileSync(CONFIG.LOGGING.FILE_PATH, logMessage + '\n');
            } catch (error) {
                console.error(`写入日志文件失败: ${error.message}`);
            }
        }
    }
    
    static info(message) {
        this.log(message, 'info');
    }
    
    static error(message) {
        this.log(message, 'error');
    }
    
    static warn(message) {
        this.log(message, 'warn');
    }
    
    static debug(message) {
        this.log(message, 'debug');
    }
}

module.exports = Logger;