// controllers/roomController.js - 房间控制器
const RoomService = require('../services/RoomService');
const Validator = require('../utils/validator');
const Logger = require('../utils/logger');

class RoomController {
    // 创建房间
    static create(req, res) {
        try {
            const { roomId, userId, nickname, roomName, mediaConfig } = req.body;
            
            // 验证必要参数
            const missing = Validator.validateRequiredFields(['roomId', 'userId', 'mediaConfig'], req.body);
            if (missing.length > 0) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: `缺少必要参数: ${missing.join(', ')}`,
                    data: null
                });
            }

            // 验证房间ID格式
            const roomIdError = Validator.validateRoomId(roomId);
            if (roomIdError) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: roomIdError,
                    data: null
                });
            }

            // 验证用户ID格式
            const userIdError = Validator.validateUserId(userId);
            if (userIdError) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: userIdError,
                    data: null
                });
            }

            // 验证昵称格式
            const nicknameError = Validator.validateNickname(nickname);
            if (nicknameError) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: nicknameError,
                    data: null
                });
            }

            // 创建房间
            const result = RoomService.createRoom(roomId, userId, nickname, roomName, mediaConfig);
            
            if (result.success) {
                Logger.info(`房间 ${roomId} 已创建，创建者: ${userId}`);
            }
            
            return res.status(result.code).json(result);
            
        } catch (error) {
            Logger.error(`创建房间错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }

    // 加入房间
    static join(req, res) {
        try {
            const { roomId, userId, nickname } = req.body;
            
            const missing = Validator.validateRequiredFields(['roomId', 'userId'], req.body);
            if (missing.length > 0) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: `缺少必要参数: ${missing.join(', ')}`,
                    data: null
                });
            }

            const roomIdError = Validator.validateRoomId(roomId);
            if (roomIdError) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: roomIdError,
                    data: null
                });
            }

            const userIdError = Validator.validateUserId(userId);
            if (userIdError) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: userIdError,
                    data: null
                });
            }

            const nicknameError = Validator.validateNickname(nickname);
            if (nicknameError) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: nicknameError,
                    data: null
                });
            }

            const result = RoomService.joinRoom(roomId, userId, nickname);
            
            if (result.success) {
                Logger.info(`用户 ${userId} 加入房间 ${roomId}`);
            }
            
            return res.status(result.code).json(result);
            
        } catch (error) {
            Logger.error(`加入房间错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }

    // 查询房间用户
    static getUsers(req, res) {
        try {
            const { roomId } = req.params;
            const { userId } = req.query;
            
            if (!roomId) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '房间ID不能为空',
                    data: null
                });
            }

            const result = RoomService.getRoomUsers(roomId, userId);
            return res.status(result.code).json(result);
            
        } catch (error) {
            Logger.error(`查询房间用户错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }

    // 离开房间
    static leave(req, res) {
        try {
            const { roomId, userId } = req.body;
            
            const missing = Validator.validateRequiredFields(['roomId', 'userId'], req.body);
            if (missing.length > 0) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: `缺少必要参数: ${missing.join(', ')}`,
                    data: null
                });
            }

            const result = RoomService.leaveRoom(roomId, userId);
            
            if (result.success) {
                Logger.info(`用户 ${userId} 离开房间 ${roomId}`);
            }
            
            return res.status(result.code).json(result);
            
        } catch (error) {
            Logger.error(`离开房间错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }

    // 获取所有房间
    static getAll(req, res) {
        try {
            const result = RoomService.getAllRooms();
            return res.status(result.code).json(result);
            
        } catch (error) {
            Logger.error(`获取房间列表错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }

    // 获取房间信息
    static getInfo(req, res) {
        try {
            const { roomId } = req.params;
            
            if (!roomId) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '房间ID不能为空',
                    data: null
                });
            }

            const result = RoomService.getRoomInfo(roomId);
            return res.status(result.code).json(result);
            
        } catch (error) {
            Logger.error(`获取房间信息错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }

    // 更新媒体服务配置
    static updateMediaConfig(req, res) {
        try {
            const { roomId } = req.params;
            const { userId, mediaConfig } = req.body;
            
            const missing = Validator.validateRequiredFields(['userId', 'mediaConfig'], req.body);
            if (missing.length > 0) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: `缺少必要参数: ${missing.join(', ')}`,
                    data: null
                });
            }

            if (!roomId) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '房间ID不能为空',
                    data: null
                });
            }

            const result = RoomService.updateMediaConfig(roomId, userId, mediaConfig);
            
            if (result.success) {
                Logger.info(`房间 ${roomId} 媒体配置已更新`);
            }
            
            return res.status(result.code).json(result);
            
        } catch (error) {
            Logger.error(`更新媒体服务配置错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }

    // 解散房间
    static disband(req, res) {
        try {
            Logger.info(`disband request body: ${JSON.stringify(req.body)}`);
            const { roomId, userId } = req.body;
            
            if (!roomId) {
                Logger.info(`roomId is null or undefined, req.body: ${JSON.stringify(req.body)}`);
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '房间ID不能为空',
                    data: null
                });
            }

            const result = RoomService.disbandRoom(roomId, userId);
            
            if (result.success) {
                Logger.info(`房间 ${roomId} 已被创建者 ${userId} 解散`);
            }
            
            return res.status(result.code).json(result);
            
        } catch (error) {
            Logger.error(`解散房间错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }
}

module.exports = RoomController;