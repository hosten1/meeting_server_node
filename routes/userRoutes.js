// routes/userRoutes.js - 用户路由
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// 心跳检测
router.post('/heartbeat', UserController.heartbeat);

// 更新用户信息
router.put('/:userId', UserController.update);

module.exports = router;