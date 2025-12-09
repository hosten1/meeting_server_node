// controllers/userController.js - 用户控制器
const UserService = require('../services/UserService');
const Validator = require('../utils/validator');
const Logger = require('../utils/logger');

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

    // 更新用户信息
    static update(req, res) {
        try {
            const { userId } = req.params;
            const { nickname } = req.body;
            
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    code: 400,
                    message: '用户ID不能为空',
                    data: null
                });
            }

            const result = UserService.updateUser(userId, nickname);
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
}

module.exports = UserController;