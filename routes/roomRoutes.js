// routes/roomRoutes.js - 房间路由
const express = require('express');
const router = express.Router();
const RoomController = require('../controllers/roomController');

// 创建房间
router.post('/create', RoomController.create);

// 加入房间
router.post('/join', RoomController.join);

// 查询房间用户
router.get('/:roomId/users', RoomController.getUsers);

// 离开房间
router.post('/leave', RoomController.leave);

//解散房间
router.post('/disband', RoomController.disband);

// 获取所有房间列表
router.get('/', RoomController.getAll);
router.get('/rooms', RoomController.getAll);

// 获取房间信息
router.get('/:roomId', RoomController.getInfo);

// 更新房间媒体服务配置
router.put('/:roomId/media-config', RoomController.updateMediaConfig);

// 解散房间
//router.delete('/:roomId', RoomController.disband);

module.exports = router;