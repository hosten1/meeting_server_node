// test-socketio.js - Socket.IO 测试脚本
const io = require('socket.io-client');

// Socket.IO 服务地址
const SERVER_URL = 'https://localhost:5349';

// 测试配置
const TEST_ROOM_ID = 'test-room-' + Date.now();
const TEST_USER_ID_1 = 'user1-' + Date.now();
const TEST_USER_ID_2 = 'user2-' + Date.now();
const TEST_NICKNAME_1 = '测试用户1';
const TEST_NICKNAME_2 = '测试用户2';

// 测试结果
let testResults = {
    connect: false,
    joinRoom: false,
    getRooms: false,
    getRoomUsers: false,
    message: false,
    leaveRoom: false
};

// 测试用户1
function testUser1() {
    console.log('=== 测试用户1 ===');
    
    // 连接到服务器
    const socket = io(SERVER_URL, {
        reconnection: false,
        rejectUnauthorized: false,
        transports: ['websocket']
    });
    
    socket.on('connect', () => {
        console.log(`✓ 用户1 连接成功，socket.id: ${socket.id}`);
        testResults.connect = true;
        
        // 测试创建房间
        console.log('测试创建房间...');
        // 对于Socket.IO，我们使用joinRoom会自动创建房间，所以直接调用joinRoom
        socket.emit('joinRoom', {
            roomId: TEST_ROOM_ID,
            userId: TEST_USER_ID_1,
            nickname: TEST_NICKNAME_1
        });
    });
    
    socket.on('joinRoomResult', (result) => {
        if (result.success) {
            console.log('✓ 用户1 加入房间成功');
            testResults.joinRoom = true;
            
            // 测试获取房间列表
            console.log('测试获取房间列表...');
            socket.emit('getRooms');
        } else {
            console.error(`✗ 用户1 加入房间失败: ${result.message}`);
        }
    });
    
    socket.on('getRoomsResult', (result) => {
        if (result.success) {
            console.log(`✓ 获取房间列表成功，共 ${result.data.count} 个房间`);
            testResults.getRooms = true;
            
            // 测试获取房间用户
            console.log('测试获取房间用户...');
            socket.emit('getRoomUsers', {
                roomId: TEST_ROOM_ID
            });
        } else {
            console.error(`✗ 获取房间列表失败: ${result.message}`);
        }
    });
    
    socket.on('getRoomUsersResult', (result) => {
        if (result.success) {
            console.log(`✓ 获取房间用户成功，共 ${result.data.userCount} 个用户`);
            testResults.getRoomUsers = true;
            
            // 测试发送消息
            console.log('测试发送消息...');
            socket.emit('message', {
                roomId: TEST_ROOM_ID,
                message: '测试消息' + Date.now()
            });
        } else {
            console.error(`✗ 获取房间用户失败: ${result.message}`);
        }
    });
    
    socket.on('message', (data) => {
        console.log(`✓ 收到房间消息: ${data.message}`);
        testResults.message = true;
        
        // 测试心跳
        console.log('测试心跳...');
        socket.emit('heartbeat', {
            userId: TEST_USER_ID_1
        });
    });
    
    socket.on('heartbeatResult', (result) => {
        if (result.success) {
            console.log('✓ 心跳成功');
            
            // 测试离开房间
            console.log('测试离开房间...');
            socket.emit('leaveRoom', {
                roomId: TEST_ROOM_ID,
                userId: TEST_USER_ID_1
            });
        } else {
            console.error(`✗ 心跳失败: ${result.message}`);
        }
    });
    
    socket.on('leaveRoomResult', (result) => {
        if (result.success) {
            console.log('✓ 用户1 离开房间成功');
            testResults.leaveRoom = true;
            
            // 断开连接
            socket.disconnect();
        } else {
            console.error(`✗ 用户1 离开房间失败: ${result.message}`);
        }
    });
    
    socket.on('userJoined', (data) => {
        console.log(`⚠ 用户加入通知: ${data.nickname} (${data.userId}) 加入了房间`);
    });
    
    socket.on('userLeft', (data) => {
        console.log(`⚠ 用户离开通知: ${data.userId} 离开了房间`);
    });
    
    socket.on('disconnect', () => {
        console.log('✓ 用户1 断开连接');
        
        // 测试用户2
        setTimeout(() => {
            testUser2();
        }, 1000);
    });
    
    socket.on('connect_error', (error) => {
        console.error(`✗ 用户1 连接失败: ${error.message}`);
    });
}

// 测试用户2
function testUser2() {
    console.log('\n=== 测试用户2 ===');
    
    // 连接到服务器
    const socket = io(SERVER_URL, {
        reconnection: false,
        rejectUnauthorized: false,
        transports: ['websocket']
    });
    
    socket.on('connect', () => {
        console.log(`✓ 用户2 连接成功，socket.id: ${socket.id}`);
        
        // 测试加入房间
        console.log('测试加入房间...');
        socket.emit('joinRoom', {
            roomId: TEST_ROOM_ID,
            userId: TEST_USER_ID_2,
            nickname: TEST_NICKNAME_2
        });
    });
    
    socket.on('joinRoomResult', (result) => {
        if (result.success) {
            console.log('✓ 用户2 加入房间成功');
            
            // 等待1秒后测试解散房间
            setTimeout(() => {
                console.log('测试解散房间...');
                socket.emit('disbandRoom', {
                    roomId: TEST_ROOM_ID,
                    userId: TEST_USER_ID_2
                });
            }, 1000);
        } else {
            console.error(`✗ 用户2 加入房间失败: ${result.message}`);
        }
    });
    
    socket.on('disbandRoomResult', (result) => {
        if (result.success) {
            console.log('✓ 解散房间成功');
        } else {
            console.error(`✗ 解散房间失败: ${result.message}`);
        }
        
        // 断开连接
        socket.disconnect();
    });
    
    socket.on('roomDisbanded', (data) => {
        console.log(`⚠ 房间解散通知: 房间 ${data.roomId} 已被解散`);
    });
    
    socket.on('disconnect', () => {
        console.log('✓ 用户2 断开连接');
        
        // 显示测试结果
        setTimeout(() => {
            showTestResults();
        }, 500);
    });
    
    socket.on('connect_error', (error) => {
        console.error(`✗ 用户2 连接失败: ${error.message}`);
    });
}

// 显示测试结果
function showTestResults() {
    console.log('\n=== 测试结果 ===');
    console.log('连接: ' + (testResults.connect ? '✓ 成功' : '✗ 失败'));
    console.log('加入房间: ' + (testResults.joinRoom ? '✓ 成功' : '✗ 失败'));
    console.log('获取房间列表: ' + (testResults.getRooms ? '✓ 成功' : '✗ 失败'));
    console.log('获取房间用户: ' + (testResults.getRoomUsers ? '✓ 成功' : '✗ 失败'));
    console.log('发送消息: ' + (testResults.message ? '✓ 成功' : '✗ 失败'));
    console.log('离开房间: ' + (testResults.leaveRoom ? '✓ 成功' : '✗ 失败'));
    
    // 检查是否所有测试都通过
    const allPassed = Object.values(testResults).every(result => result);
    console.log('\n' + (allPassed ? '🎉 所有测试通过！' : '❌ 部分测试失败！'));
    
    process.exit(allPassed ? 0 : 1);
}

// 启动测试
console.log(`=== Socket.IO 测试开始 ===`);
console.log(`测试服务器: ${SERVER_URL}`);
console.log(`测试房间: ${TEST_ROOM_ID}`);
console.log(`测试用户1: ${TEST_USER_ID_1} (${TEST_NICKNAME_1})`);
console.log(`测试用户2: ${TEST_USER_ID_2} (${TEST_NICKNAME_2})`);
console.log('=========================\n');

testUser1();
