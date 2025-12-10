// controllers/userController.js - 用户控制器
const UserService = require('../services/UserService');
const Validator = require('../utils/validator');
const Logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const CONFIG = require('../config');

class UserController {
    // 发送心跳
    static heartbeat(req, res) {
        try {
            const { userId, roomId } = req.body;
            
            const missing = Validator.validateRequiredFields(['userId', 'roomId'], req.body);
            if (missing.length > 0) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: `缺少必要参数: ${missing.join(', ')}`,
                    data: null
                });
            }

            const result = UserService.sendHeartbeat(userId, roomId);
            return res.status(result.code).json(result);
            
        } catch (error) {
            Logger.error(`心跳更新错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }

    // 获取所有用户
    static getAllUsers(req, res) {
        try {
            const result = UserService.getAllUsers();
            return res.status(result.code).json(result);
        } catch (error) {
            Logger.error(`获取所有用户错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }

    // 获取单个用户
    static getUserById(req, res) {
        try {
            const { userId } = req.params;
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '用户ID不能为空',
                    data: null
                });
            }

            const result = UserService.getUserById(userId);
            return res.status(result.code).json(result);
        } catch (error) {
            Logger.error(`获取单个用户错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }

    // 新增用户
    static createUser(req, res) {
        try {
            const { userId, nickname, roomId, type, status, avatar } = req.body;
            
            const missing = Validator.validateRequiredFields(['userId', 'nickname'], req.body);
            if (missing.length > 0) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: `缺少必要参数: ${missing.join(', ')}`,
                    data: null
                });
            }

            const result = UserService.createUser(userId, nickname, roomId, type, status, avatar);
            return res.status(result.code).json(result);
        } catch (error) {
            Logger.error(`新增用户错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }

    // 更新用户信息
    static update(req, res) {
        try {
            const { userId } = req.params;
            const updates = req.body;
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '用户ID不能为空',
                    data: null
                });
            }

            const result = UserService.updateUser(userId, updates);
            return res.status(result.code).json(result);
            
        } catch (error) {
            Logger.error(`更新用户信息错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }

    // 删除用户
    static deleteUser(req, res) {
        try {
            const { userId } = req.params;
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '用户ID不能为空',
                    data: null
                });
            }

            const result = UserService.deleteUser(userId);
            return res.status(result.code).json(result);
        } catch (error) {
            Logger.error(`删除用户错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }

    // 上传头像
    static uploadAvatar(req, res) {
        try {
            // 检查是否有文件上传
            if (!req.files || !req.files.avatar) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '未找到上传的头像文件',
                    data: null
                });
            }

            const avatarFile = req.files.avatar;
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
            const maxSize = 2 * 1024 * 1024; // 2MB

            // 检查文件类型
            if (!allowedTypes.includes(avatarFile.mimetype)) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '不支持的文件类型，仅支持JPG、PNG、GIF格式',
                    data: null
                });
            }

            // 检查文件大小
            if (avatarFile.size > maxSize) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '文件大小超过限制，最大支持2MB',
                    data: null
                });
            }

            // 创建头像存储目录
            const avatarDir = path.join(__dirname, '../public/avatars');
            if (!fs.existsSync(avatarDir)) {
                fs.mkdirSync(avatarDir, { recursive: true });
            }

            // 生成唯一的文件名
            const fileName = `avatar_${Date.now()}_${Math.floor(Math.random() * 10000)}.${avatarFile.name.split('.').pop()}`;
            const filePath = path.join(avatarDir, fileName);

            // 保存文件
            avatarFile.mv(filePath, (err) => {
                if (err) {
                    Logger.error(`保存头像文件错误: ${err.message}`);
                    return res.status(500).json({
                        success: false,
                        code: 500,
                        message: '保存头像文件失败',
                        data: null
                    });
                }

                // 生成头像URL
                const avatarUrl = `${CONFIG.SERVER.URL}/avatars/${fileName}`;

                return res.status(200).json({
                    success: true,
                    code: 200,
                    message: '头像上传成功',
                    data: {
                        avatarUrl: avatarUrl
                    }
                });
            });
        } catch (error) {
            Logger.error(`上传头像错误: ${error.message}`);
            return res.status(500).json({
                success: false,
                code: 500,
                message: '服务器内部错误',
                data: null
            });
        }
    }
}

module.exports = UserController;