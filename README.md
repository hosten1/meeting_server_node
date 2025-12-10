# 房间管理系统服务器

## 项目介绍

房间管理系统服务器是一个基于 Node.js 和 Express 开发的实时音视频房间管理服务器，支持 HTTPS 和 WebSocket (Socket.IO 2.x) 通信。

## 功能特性

- 房间创建、加入、离开、解散
- 房间用户管理
- 实时通知（Socket.IO 2.x）
- 健康检查
- 系统配置
- 日志管理
- 自动清理闲置房间

## 技术栈

- Node.js
- Express
- Socket.IO 2.x（兼容 iOS 客户端）
- HTTPS
- PM2（生产环境部署）

## 目录结构

```
roomServer/
├── certs/                  # HTTPS 证书目录
│   ├── cert.pem           # 证书文件
│   └── key.pem            # 私钥文件
├── controllers/            # 控制器
│   ├── roomController.js  # 房间控制器
│   └── userController.js  # 用户控制器
├── logs/                   # 日志目录
│   └── server.log         # 服务器日志
├── models/                 # 数据模型
│   ├── MediaServiceConfig.js
│   ├── Room.js
│   └── User.js
├── public/                 # 静态资源
│   ├── css/
│   ├── js/
│   └── index.html         # 后台管理页面
├── routes/                 # 路由
│   ├── index.js
│   ├── roomRoutes.js
│   └── userRoutes.js
├── services/               # 业务逻辑
│   ├── RoomService.js
│   └── UserService.js
├── utils/                  # 工具函数
│   ├── cleaner.js
│   ├── logger.js
│   └── validator.js
├── config.js               # 配置文件
├── package.json            # 依赖配置
├── restart-server.sh       # 重启脚本
└── server.js               # 主入口文件
```

## 安装和运行

### 1. 克隆或下载项目

```bash
cd ~
git clone <repository-url>
cd roomServer
```

### 2. 安装依赖

```bash
npm install
```

### 3. 运行项目

#### 开发环境

```bash
# 直接启动
node server.js

# 或者使用开发模式
npm run dev
```

#### 生产环境

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 使用 PM2 启动应用
pm2 start server.js --name room-server-https

# 设置开机自启
pm2 startup
# 按照提示执行生成的命令

# 保存当前进程列表
pm2 save

# 查看 PM2 状态
pm2 status

# 查看日志
pm2 logs room-server-https

# 停止应用
pm2 stop room-server-https

# 重启应用
pm2 restart room-server-https
```

## 配置说明

配置文件：`config.js`

```javascript
const CONFIG = {
    // 服务器配置
    PORT: process.env.PORT || 5349,
    HOST: process.env.HOST || '0.0.0.0',
    
    // 日志配置
    LOGGING: {
        ENABLED: true,
        LEVEL: process.env.LOG_LEVEL || 'info',
        FILE_PATH: path.join(__dirname, 'logs', 'server.log'),
        MAX_SIZE: '10m',
        MAX_FILES: '7d'
    },
    
    // CORS配置
    CORS: {
        ORIGIN: process.env.CORS_ORIGIN || "*",
        METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
        CREDENTIALS: true
    },
    
    // 房间配置
    ROOM: {
        MAX_USERS_PER_ROOM: 50,
        CLEANUP_INTERVAL: 10 * 60 * 1000, // 10分钟
        OFFLINE_TIMEOUT: 30 * 60 * 1000,  // 30分钟
        ROOM_IDLE_TIMEOUT: 60 * 60 * 1000 // 1小时
    },
    
    // SSL配置
    SSL: {
        KEY_PATH: path.join(__dirname, 'certs', 'key.pem'),
        CERT_PATH: path.join(__dirname, 'certs', 'cert.pem')
    },
    
    // 环境
    NODE_ENV: process.env.NODE_ENV || 'development',
    DEBUG: process.env.DEBUG || false
};
```

## API 接口文档

### 健康检查

```
GET /api/health
```

**响应示例**：
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-12-10T01:00:12.854Z",
  "stats": {
    "rooms": 0,
    "totalUsers": 0,
    "onlineUsers": 0,
    "activeRooms": 0
  }
}
```

### 房间相关接口

#### 创建房间

```
POST /api/room/create
```

**请求参数**：
```json
{
  "roomId": "test-room",
  "userId": "user1",
  "nickname": "测试用户",
  "roomName": "测试房间",
  "mediaConfig": {
    "host": "localhost",
    "port": 6000,
    "protocol": "https"
  }
}
```

#### 加入房间

```
POST /api/room/join
```

**请求参数**：
```json
{
  "roomId": "test-room",
  "userId": "user1",
  "nickname": "测试用户"
}
```

#### 离开房间

```
POST /api/room/leave
```

**请求参数**：
```json
{
  "roomId": "test-room",
  "userId": "user1"
}
```

#### 获取所有房间

```
GET /api/room
GET /api/room/rooms
```

#### 获取房间信息

```
GET /api/room/:roomId
```

#### 获取房间用户

```
GET /api/room/:roomId/users
```

#### 更新房间媒体配置

```
PUT /api/room/:roomId/media-config
```

**请求参数**：
```json
{
  "userId": "user1",
  "mediaConfig": {
    "host": "localhost",
    "port": 6000,
    "protocol": "https"
  }
}
```

#### 解散房间

```
POST /api/room/disband
```

**请求参数**：
```json
{
  "roomId": "test-room",
  "userId": "user1"
}
```

### 用户相关接口

#### 心跳检测

```
POST /api/user/heartbeat
```

**请求参数**：
```json
{
  "userId": "user1"
}
```

#### 更新用户信息

```
PUT /api/user/:userId
```

**请求参数**：
```json
{
  "nickname": "新昵称"
}
```

### 服务器管理接口

#### 重启服务器（仅开发环境可用）

```
POST /api/restart
```

## Socket.IO 事件文档

### 客户端事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `createRoom` | `{roomId, userId, nickname, roomName, mediaConfig}` | 创建新房间 |
| `joinRoom` | `{roomId, userId, nickname}` | 加入指定房间 |
| `leaveRoom` | `{roomId, userId}` | 离开指定房间 |
| `getRooms` | 无 | 获取所有房间列表 |
| `getRoomUsers` | `{roomId}` | 获取指定房间的用户列表 |
| `getRoomInfo` | `{roomId}` | 获取指定房间的信息 |
| `updateMediaConfig` | `{roomId, userId, mediaConfig}` | 更新房间媒体配置 |
| `disbandRoom` | `{roomId, userId}` | 解散指定房间 |
| `heartbeat` | `{userId}` | 更新用户活动时间 |
| `updateUser` | `{userId, nickname}` | 更新用户信息 |
| `healthCheck` | 无 | 健康检查 |

### 服务器事件

| 事件名 | 参数 | 描述 |
|--------|------|------|
| `createRoomResult` | `{success, code, message, data}` | 创建房间结果 |
| `joinRoomResult` | `{success, code, message, data}` | 加入房间结果 |
| `leaveRoomResult` | `{success, code, message, data}` | 离开房间结果 |
| `getRoomsResult` | `{success, code, message, data}` | 获取房间列表结果 |
| `getRoomUsersResult` | `{success, code, message, data}` | 获取房间用户列表结果 |
| `getRoomInfoResult` | `{success, code, message, data}` | 获取房间信息结果 |
| `updateMediaConfigResult` | `{success, code, message, data}` | 更新媒体配置结果 |
| `disbandRoomResult` | `{success, code, message, data}` | 解散房间结果 |
| `heartbeatResult` | `{success, message, timestamp}` | 心跳结果 |
| `updateUserResult` | `{success, code, message, data}` | 更新用户信息结果 |
| `healthCheckResult` | `{success, status, timestamp, stats}` | 健康检查结果 |
| `message` | `{userId, nickname, message, timestamp}` | 收到消息 |
| `userJoined` | `{userId, nickname, timestamp}` | 新用户加入房间通知 |
| `userLeft` | `{userId, timestamp}` | 用户离开房间通知 |
| `roomDisbanded` | `{roomId, disbandedAt}` | 房间解散通知 |
| `roomCreated` | `{roomId, roomName, creator, createdAt, userCount, maxUsers, isActive, lastActive, mediaConfig}` | 房间创建通知（全局） |

## 测试示例

### 1. 测试健康检查

```bash
curl -k https://localhost:5349/api/health
```

### 2. 加入房间

```bash
curl -k -X POST https://localhost:5349/api/room/join \
  -H "Content-Type: application/json" \
  -d '{"roomId": "test-room", "userId": "user1", "nickname": "测试用户"}'
```

### 3. 查询房间用户

```bash
curl -k https://localhost:5349/api/room/test-room/users
```

### 4. 查看所有房间

```bash
curl -k https://localhost:5349/api/room
```

## Socket.IO 测试

### 1. 使用 Node.js 测试脚本

#### 测试内容

- Socket.IO 连接和断开连接
- 通过 Socket.IO 创建房间
- 加入房间和离开房间
- 获取房间列表和房间用户
- 发送和接收消息
- 解散房间
- 接收房间解散通知

#### 使用方法

```bash
node test-socket.js
```

### 2. 使用 HTML 测试页面

#### 测试内容

- 手动测试 Socket.IO 功能
- 自动运行所有测试用例
- 实时状态更新和详细日志
- 支持 Socket.IO 2.x 客户端

#### 使用方法

1. 启动服务器
2. 在浏览器中访问：
   ```
   https://localhost:5349/test-socketio.html
   ```
3. 按照页面提示进行测试

#### 功能说明

- **连接测试**：测试 Socket.IO 连接和断开连接
- **创建房间**：使用 Socket.IO 创建新房间
- **房间操作**：加入房间、离开房间、解散房间、获取房间列表和用户
- **消息测试**：发送和接收消息
- **自动测试**：运行所有测试用例，包括创建房间、加入房间、发送消息和解散房间
- **测试结果**：显示测试通过/失败/待定的数量和详细结果

#### 自动测试流程

1. 连接到服务器
2. 创建新房间
3. 获取房间列表
4. 获取房间用户
5. 发送测试消息
6. 解散房间
7. 断开连接
8. 显示测试结果弹出反馈

### 3. 测试结果说明

测试完成后，会显示详细的测试结果，包括：

- 总测试用例数量
- 通过的测试用例数量
- 失败的测试用例数量
- 待定的测试用例数量
- 每个测试用例的详细结果

HTML测试页面还会显示实时日志，记录每一步操作的详细信息。

## 重启服务器

### 使用重启脚本

```bash
bash restart-server.sh
```

### 通过 API 重启（仅开发环境）

```bash
curl -k -X POST https://localhost:5349/api/restart
```

## 日志管理

### 查看日志

```bash
# 查看实时日志
tail -f logs/server.log

# 查看最近 100 行
head -n 100 logs/server.log
```

### 清理日志

```bash
npm run clean-logs
```

## 常见问题

### 1. 端口被占用

```bash
# 查看端口占用情况
lsof -i :5349

# 杀死占用端口的进程
kill -9 <PID>
```

### 2. 证书问题

确保 `certs` 目录下存在有效的证书文件 `cert.pem` 和 `key.pem`。

### 3. 权限问题

确保 `logs` 目录和 `certs` 目录有正确的写入权限。

## 许可证

MIT