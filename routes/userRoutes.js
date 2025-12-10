// routes/userRoutes.js - 用户路由
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// 获取所有用户
router.get('/', UserController.getAllUsers);

// 获取单个用户
router.get('/:userId', UserController.getUserById);

// 新增用户
router.post('/', UserController.createUser);

// 更新用户信息
router.put('/:userId', UserController.update);

// 删除用户
router.delete('/:userId', UserController.deleteUser);

// 上传头像
router.post('/upload-avatar', UserController.uploadAvatar);

// 心跳检测
router.post('/heartbeat', UserController.heartbeat);

module.exports = router;