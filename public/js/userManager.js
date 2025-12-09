// 用户管理功能

// 加载用户数据
async function loadUsers() {
    const onlineUsersList = document.getElementById('onlineUsersList');
    const offlineUsersList = document.getElementById('offlineUsersList');
    
    if (!onlineUsersList || !offlineUsersList) return;
    
    try {
        onlineUsersList.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>加载在线用户...</p></div>';
        offlineUsersList.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>加载离线用户...</p></div>';
        
        // 获取所有房间
        const roomsResponse = await fetch(`${API_BASE_URL}/room`);
        const roomsData = await roomsResponse.json();
        
        // 收集所有用户
        let allUsers = [];
        const rooms = roomsData.data.rooms || [];
        
        for (const room of rooms) {
            const usersResponse = await fetch(`${API_BASE_URL}/room/${room.roomId}/users`);
            const usersData = await usersResponse.json();
            
            if (usersData.success && usersData.data.users) {
                allUsers = allUsers.concat(usersData.data.users.map(user => ({
                    ...user,
                    roomName: room.roomName
                })));
            }
        }
        
        window.appState.usersData = allUsers;
        
        // 分离在线和离线用户
        const onlineUsers = allUsers.filter(user => user.isOnline);
        const offlineUsers = allUsers.filter(user => !user.isOnline);
        
        // 显示在线用户
        let onlineHtml = '';
        if (onlineUsers.length === 0) {
            onlineHtml = '<p class="text-center">暂无在线用户</p>';
        } else {
            onlineUsers.forEach(user => {
                const joinedTime = window.utils.formatDate(user.joinedAt);
                
                onlineHtml += `
                    <div class="user-card">
                        <div class="user-avatar" style="background-color: #27ae60;">${user.nickname.charAt(0).toUpperCase()}</div>
                        <div class="user-info">
                            <h4>${user.nickname}</h4>
                            <p>ID: ${user.userId}</p>
                            <p>房间: ${user.roomName || user.roomId}</p>
                            <p>加入时间: ${joinedTime}</p>
                        </div>
                        <div class="online-indicator online"></div>
                    </div>
                `;
            });
        }
        onlineUsersList.innerHTML = onlineHtml;
        
        // 显示离线用户（最近24小时）
        let offlineHtml = '';
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentOfflineUsers = offlineUsers.filter(user => new Date(user.lastActive) > oneDayAgo);
        
        if (recentOfflineUsers.length === 0) {
            offlineHtml = '<p class="text-center">暂无最近离线用户</p>';
        } else {
            recentOfflineUsers.forEach(user => {
                const lastActiveTime = window.utils.formatDate(user.lastActive);
                
                offlineHtml += `
                    <div class="user-card">
                        <div class="user-avatar" style="background-color: #7f8c8d;">${user.nickname.charAt(0).toUpperCase()}</div>
                        <div class="user-info">
                            <h4>${user.nickname}</h4>
                            <p>ID: ${user.userId}</p>
                            <p>房间: ${user.roomName || user.roomId}</p>
                            <p>最后活动: ${lastActiveTime}</p>
                        </div>
                        <div class="online-indicator offline"></div>
                    </div>
                `;
            });
        }
        offlineUsersList.innerHTML = offlineHtml;
        
    } catch (error) {
        console.error('加载用户数据失败:', error);
        onlineUsersList.innerHTML = '<p class="text-center">加载用户数据失败</p>';
        offlineUsersList.innerHTML = '<p class="text-center">加载用户数据失败</p>';
        window.utils.showToast('加载用户数据失败', 'error');
    }
}

// 加载日志
async function loadLogs() {
    const logsTableBody = document.getElementById('logsTableBody');
    if (!logsTableBody) return;
    
    try {
        logsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <p>加载日志数据...</p>
                    </div>
                </td>
            </tr>
        `;
        
        // 这里模拟日志数据，实际应用中应该从服务器获取
        const mockLogs = [
            { time: new Date().toLocaleString(), level: 'INFO', module: '房间服务', action: '创建房间', detail: '房间 test-room 创建成功' },
            { time: new Date(Date.now() - 300000).toLocaleString(), level: 'INFO', module: '用户服务', action: '用户加入', detail: '用户 user123 加入房间 test-room' },
            { time: new Date(Date.now() - 600000).toLocaleString(), level: 'WARN', module: '清理服务', action: '清理离线用户', detail: '清理了 2 个离线用户' },
            { time: new Date(Date.now() - 900000).toLocaleString(), level: 'ERROR', module: 'API服务', action: '请求错误', detail: '/api/room/invalid 接口不存在' },
            { time: new Date(Date.now() - 1200000).toLocaleString(), level: 'INFO', module: '系统', action: '服务器启动', detail: 'HTTPS服务器启动在端口 6000' }
        ];
        
        let rows = '';
        mockLogs.forEach(log => {
            let levelClass = '';
            if (log.level === 'ERROR') levelClass = 'status-inactive';
            else if (log.level === 'WARN') levelClass = 'status-active';
            
            rows += `
                <tr>
                    <td>${log.time}</td>
                    <td><span class="status-badge ${levelClass}">${log.level}</span></td>
                    <td>${log.module}</td>
                    <td>${log.action}</td>
                    <td>${log.detail}</td>
                </tr>
            `;
        });
        
        logsTableBody.innerHTML = rows;
    } catch (error) {
        console.error('加载日志失败:', error);
        logsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">加载日志数据失败</td>
            </tr>
        `;
    }
}

// 保存系统配置
function saveSystemConfig() {
    const port = document.getElementById('serverPort').value;
    const maxUsers = document.getElementById('maxUsersPerRoom').value;
    const userTimeout = document.getElementById('userOfflineTimeout').value;
    const roomTimeout = document.getElementById('roomIdleTimeout').value;
    const cleanupInterval = document.getElementById('cleanupInterval').value;
    
    // 这里应该调用API保存配置
    // 由于原API没有保存配置的接口，这里只是模拟
    
    window.utils.showToast('系统配置已保存', 'success');
    
    // 在实际应用中，这里应该调用API更新配置
    console.log('保存系统配置:', {
        port, maxUsers, userTimeout, roomTimeout, cleanupInterval
    });
}

// 导出用户管理函数
window.userManager = {
    loadUsers,
    loadLogs,
    saveSystemConfig
};