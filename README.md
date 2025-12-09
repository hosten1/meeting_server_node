

cd ~/roomServer

# 安装依赖
npm install

# 使用 PM2 启动
pm2 start server.js --name room-server-https

# 或者直接启动
node server.js


# 1. 测试健康检查
curl http://localhost:3000/health

# 2. 加入房间
curl -X POST http://localhost:3000/api/room/join \
  -H "Content-Type: application/json" \
  -d '{"roomId": "test-room", "username": "user1", "nickname": "测试用户"}'

# 3. 查询房间用户
curl http://localhost:3000/api/room/test-room/users

# 4. 查看所有房间
curl http://localhost:3000/api/rooms


```bash
# 全局安装 PM2
sudo npm install -g pm2

# 使用 PM2 启动应用
cd ~/roomServer
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