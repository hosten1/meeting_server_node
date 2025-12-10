const io = require('socket.io-client');

// 测试配置
const SERVER_URL = 'https://localhost:5349';
const testConfig = {
  roomId: `test-room-${Date.now()}`,
  userId: `test-user-${Date.now()}`,
  nickname: '测试用户'
};

console.log('=== Socket.IO 测试开始 ===');
console.log('测试配置:', testConfig);

// 创建Socket.IO客户端
const socket = io(SERVER_URL, {
  reconnection: false,
  rejectUnauthorized: false,
  transports: ['websocket']
});

// 连接事件
socket.on('connect', () => {
  console.log('✓ 连接成功');
  
  // 使用Socket.IO创建房间
    console.log('尝试通过Socket.IO创建房间...');
    socket.emit('createRoom', {
      roomId: testConfig.roomId,
      userId: testConfig.userId,
      nickname: testConfig.nickname,
      // 添加默认的媒体服务配置，避免验证失败
      mediaConfig: {
        host: 'localhost',
        port: 8443
      }
    });
});

// 创建房间结果
socket.on('createRoomResult', (result) => {
  if (result.success) {
    console.log('✓ Socket.IO创建房间成功');
    
    // 获取房间列表
    console.log('尝试获取房间列表...');
    socket.emit('getRooms');
  } else {
    console.log('✗ Socket.IO创建房间失败:', result.message);
    socket.disconnect();
  }
});

// 加入房间结果
socket.on('joinRoomResult', (result) => {
  if (result.success) {
    console.log('✓ 加入房间成功');
    
    // 获取房间列表
    console.log('尝试获取房间列表...');
    socket.emit('getRooms');
  } else {
    console.log('✗ 加入房间失败:', result.message);
    socket.disconnect();
  }
});

// 获取房间列表结果
socket.on('getRoomsResult', (result) => {
  if (result.success) {
    console.log('✓ 获取房间列表成功');
    console.log('房间数量:', result.data.count);
    console.log('房间列表:', result.data.rooms);
    
    // 获取房间用户
    console.log('尝试获取房间用户...');
    socket.emit('getRoomUsers', {
      roomId: testConfig.roomId
    });
  } else {
    console.log('✗ 获取房间列表失败:', result.message);
    socket.disconnect();
  }
});

// 获取房间用户结果
socket.on('getRoomUsersResult', (result) => {
  if (result.success) {
    console.log('✓ 获取房间用户成功');
    console.log('用户数量:', result.data.userCount);
    console.log('用户列表:', result.data.users);
    
    // 发送消息
    console.log('尝试发送消息...');
    socket.emit('message', {
      roomId: testConfig.roomId,
      message: 'Hello, Socket.IO!'
    });
  } else {
    console.log('✗ 获取房间用户失败:', result.message);
    socket.disconnect();
  }
});

// 收到消息
socket.on('message', (data) => {
  console.log('✓ 收到消息:', data);
  
  // 解散房间
  console.log('尝试解散房间...');
  socket.emit('disbandRoom', {
    roomId: testConfig.roomId,
    userId: testConfig.userId
  });
});

// 解散房间结果
socket.on('disbandRoomResult', (result) => {
  if (result.success) {
    console.log('✓ 解散房间成功');
    
    // 断开连接
    console.log('尝试断开连接...');
    socket.disconnect();
  } else {
    console.log('✗ 解散房间失败:', result.message);
    socket.disconnect();
  }
});

// 离开房间结果
socket.on('leaveRoomResult', (result) => {
  if (result.success) {
    console.log('✓ 离开房间成功');
    
    // 断开连接
    console.log('尝试断开连接...');
    socket.disconnect();
  } else {
    console.log('✗ 离开房间失败:', result.message);
    socket.disconnect();
  }
});

// 房间解散通知
socket.on('roomDisbanded', (data) => {
  console.log('✓ 收到房间解散通知:', data);
});

// 断开连接事件
socket.on('disconnect', () => {
  console.log('✓ 断开连接成功');
  console.log('=== Socket.IO 测试完成 ===');
  process.exit(0);
});

// 连接错误事件
socket.on('connect_error', (error) => {
  console.log('✗ 连接错误:', error.message);
  console.log('=== Socket.IO 测试失败 ===');
  process.exit(1);
});

// 超时处理
setTimeout(() => {
  console.log('✗ 测试超时');
  console.log('=== Socket.IO 测试失败 ===');
  socket.disconnect();
  process.exit(1);
}, 10000);
