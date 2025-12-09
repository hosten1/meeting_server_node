// utils/cleaner.js - 清理工具
const RoomService = require('../services/RoomService');
const CONFIG = require('../config');
const Logger = require('./logger');

class Cleaner {
    static startCleanup() {
        const cleanupInterval = CONFIG.ROOM.CLEANUP_INTERVAL;
        const offlineTimeout = CONFIG.ROOM.OFFLINE_TIMEOUT;
        const roomIdleTimeout = CONFIG.ROOM.ROOM_IDLE_TIMEOUT;
        
//        setInterval(() => {
//            this.cleanup(offlineTimeout, roomIdleTimeout);
//        }, cleanupInterval);
//        
        Logger.info(`自动清理已启动，间隔: ${cleanupInterval/1000}秒`);
    }
    
    static cleanup(offlineTimeout, roomIdleTimeout) {
        try {
//            // 清理离线用户
//            const cleanedUsers = RoomService.cleanupOfflineUsers(offlineTimeout);
//            
//            // 清理空闲房间
//            const removedRooms = RoomService.cleanupIdleRooms(roomIdleTimeout);
//            
//            if (cleanedUsers > 0 || removedRooms > 0) {
//                Logger.warn(`清理完成 - 离线用户: ${cleanedUsers}, 空闲房间: ${removedRooms}`);
//            }
//            
//            return { cleanedUsers, removedRooms };
        } catch (error) {
            Logger.error(`清理过程中发生错误: ${error.message}`);
            return { cleanedUsers: 0, removedRooms: 0, error: error.message };
        }
    }
}

module.exports = Cleaner;