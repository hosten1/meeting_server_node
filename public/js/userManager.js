// 用户管理功能

// 初始化用户管理功能
function initUserManager() {
    // 绑定新增用户按钮事件
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => openUserEditModal());
    }
    
    // 绑定用户编辑表单提交事件
    const userEditForm = document.getElementById('userEditForm');
    if (userEditForm) {
        userEditForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveUser();
        });
    }
    
    // 绑定关闭用户编辑模态框事件
    const closeUserEdit = document.getElementById('closeUserEdit');
    if (closeUserEdit) {
        closeUserEdit.addEventListener('click', closeUserEditModal);
    }
    
    // 绑定取消用户编辑事件
    const cancelUserEdit = document.getElementById('cancelUserEdit');
    if (cancelUserEdit) {
        cancelUserEdit.addEventListener('click', closeUserEditModal);
    }
    
    // 绑定头像上传事件
    const chooseAvatarBtn = document.getElementById('chooseAvatarBtn');
    const avatarFile = document.getElementById('avatarFile');
    const removeAvatarBtn = document.getElementById('removeAvatarBtn');
    
    if (chooseAvatarBtn) {
        chooseAvatarBtn.addEventListener('click', () => {
            avatarFile.click();
        });
    }
    
    if (avatarFile) {
        avatarFile.addEventListener('change', handleAvatarChange);
    }
    
    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', removeAvatar);
    }
    
    // 绑定服务运行日志查看按钮事件
    const logsLink = document.getElementById('logs-link');
    if (logsLink) {
        logsLink.addEventListener('click', (e) => {
            // 修改点击事件，打开服务运行日志模态框
            e.preventDefault();
            openServerLogsModal();
        });
    }
    
    // 绑定服务运行日志相关事件
    const closeServerLogs = document.getElementById('closeServerLogs');
    const refreshLogs = document.getElementById('refreshLogs');
    const clearLogs = document.getElementById('clearLogs');
    
    if (closeServerLogs) {
        closeServerLogs.addEventListener('click', closeServerLogsModal);
    }
    
    if (refreshLogs) {
        refreshLogs.addEventListener('click', loadServerLogs);
    }
    
    if (clearLogs) {
        clearLogs.addEventListener('click', clearServerLogs);
    }
    
    // 绑定日志级别过滤事件
    const logLevelFilter = document.getElementById('logLevelFilter');
    if (logLevelFilter) {
        logLevelFilter.addEventListener('change', () => {
            loadServerLogs();
        });
    }
}

// 打开用户编辑模态框
function openUserEditModal(user = null) {
    const modal = document.getElementById('userEditModal');
    const title = document.getElementById('userEditTitle');
    const userIdInput = document.getElementById('editUserId');
    const nicknameInput = document.getElementById('editUserNickname');
    const typeSelect = document.getElementById('editUserType');
    const statusSelect = document.getElementById('editUserStatus');
    const roomIdInput = document.getElementById('editUserRoomId');
    
    if (user) {
        title.textContent = '编辑用户';
        userIdInput.value = user.userId;
        userIdInput.disabled = true;
        nicknameInput.value = user.nickname || '';
        typeSelect.value = user.type || 'user';
        statusSelect.value = user.status || 'active';
        roomIdInput.value = user.roomId || '';
        
        // 显示用户头像
        if (user.avatar) {
            const avatarImage = document.getElementById('avatarImage');
            const avatarPlaceholder = document.getElementById('avatarPlaceholder');
            const removeAvatarBtn = document.getElementById('removeAvatarBtn');
            
            avatarImage.src = user.avatar;
            avatarImage.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
            removeAvatarBtn.style.display = 'inline-block';
        } else {
            resetAvatarPreview();
        }
        
        window.currentEditingUser = user;
    } else {
        title.textContent = '新增用户';
        userIdInput.value = '';
        userIdInput.disabled = false;
        nicknameInput.value = '';
        typeSelect.value = 'user';
        statusSelect.value = 'active';
        roomIdInput.value = '';
        resetAvatarPreview();
        window.currentEditingUser = null;
    }
    
    modal.style.display = 'flex';
}

// 关闭用户编辑模态框
function closeUserEditModal() {
    const modal = document.getElementById('userEditModal');
    modal.style.display = 'none';
    resetAvatarPreview();
    window.currentEditingUser = null;
}

// 重置头像预览
function resetAvatarPreview() {
    const avatarImage = document.getElementById('avatarImage');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    const avatarFile = document.getElementById('avatarFile');
    const removeAvatarBtn = document.getElementById('removeAvatarBtn');
    
    avatarImage.src = '';
    avatarImage.style.display = 'none';
    avatarPlaceholder.style.display = 'block';
    avatarFile.value = '';
    removeAvatarBtn.style.display = 'none';
}

// 处理头像选择
function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // 检查文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
        window.utils.showToast('头像大小不能超过2MB', 'error');
        return;
    }
    
    // 检查文件类型
    if (!file.type.match('image.*')) {
        window.utils.showToast('请选择图片文件', 'error');
        return;
    }
    
    // 预览头像
    const reader = new FileReader();
    reader.onload = function(e) {
        const avatarImage = document.getElementById('avatarImage');
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        const removeAvatarBtn = document.getElementById('removeAvatarBtn');
        
        avatarImage.src = e.target.result;
        avatarImage.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
        removeAvatarBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
}

// 移除头像
function removeAvatar() {
    resetAvatarPreview();
}

// 保存用户
async function saveUser() {
    const userId = document.getElementById('editUserId').value;
    const nickname = document.getElementById('editUserNickname').value;
    const type = document.getElementById('editUserType').value;
    const status = document.getElementById('editUserStatus').value;
    const roomId = document.getElementById('editUserRoomId').value;
    const avatarFile = document.getElementById('avatarFile').files[0];
    
    // 验证必填字段
    if (!userId || !nickname) {
        window.utils.showToast('用户ID和昵称不能为空', 'error');
        return;
    }
    
    try {
        let avatarUrl = null;
        
        // 如果有新头像，先上传头像
        if (avatarFile) {
            avatarUrl = await uploadAvatar(avatarFile);
        }
        
        // 构建用户数据
        const userData = {
            userId,
            nickname,
            type,
            status,
            roomId: roomId || null
        };
        
        if (avatarUrl) {
            userData.avatar = avatarUrl;
        }
        
        let response;
        if (window.currentEditingUser) {
            // 编辑现有用户
            response = await fetch(`${API_BASE_URL}/user/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
        } else {
            // 新增用户
            response = await fetch(`${API_BASE_URL}/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            window.utils.showToast(window.currentEditingUser ? '用户编辑成功' : '用户新增成功', 'success');
            closeUserEditModal();
            loadUsers();
        } else {
            window.utils.showToast(result.message || '操作失败', 'error');
        }
    } catch (error) {
        console.error('保存用户失败:', error);
        window.utils.showToast('保存用户失败', 'error');
    }
}

// 上传头像
async function uploadAvatar(file) {
    try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await fetch(`${API_BASE_URL}/user/upload-avatar`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            return result.data.avatarUrl;
        } else {
            throw new Error(result.message || '头像上传失败');
        }
    } catch (error) {
        console.error('头像上传失败:', error);
        window.utils.showToast('头像上传失败', 'error');
        throw error;
    }
}

// 打开服务运行日志模态框
function openServerLogsModal() {
    const modal = document.getElementById('serverLogsModal');
    modal.style.display = 'flex';
    loadServerLogs();
}

// 关闭服务运行日志模态框
function closeServerLogsModal() {
    const modal = document.getElementById('serverLogsModal');
    modal.style.display = 'none';
}

// 加载服务运行日志
async function loadServerLogs() {
    const logsContent = document.getElementById('serverLogsContent');
    const logLevelFilter = document.getElementById('logLevelFilter');
    const selectedLevel = logLevelFilter.value;
    
    if (!logsContent) return;
    
    try {
        logsContent.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>加载日志数据...</p></div>';
        
        const response = await fetch(`${API_BASE_URL}/logs?level=${selectedLevel}`);
        const result = await response.json();
        
        if (result.success) {
            const logs = result.data.logs || [];
            
            if (logs.length === 0) {
                logsContent.innerHTML = '<p class="text-center">暂无日志数据</p>';
            } else {
                let logsHtml = '';
                logs.forEach(log => {
                    const levelClass = {
                        'INFO': 'text-info',
                        'WARN': 'text-warning',
                        'ERROR': 'text-error'
                    }[log.level] || '';
                    
                    logsHtml += `
                        <div class="log-entry ${levelClass}" style="margin-bottom: 5px;">
                            <strong>${log.time}</strong> [${log.level}] ${log.module || ''}: ${log.action} - ${log.detail}
                        </div>
                    `;
                });
                logsContent.innerHTML = logsHtml;
                
                // 滚动到底部
                logsContent.scrollTop = logsContent.scrollHeight;
            }
        } else {
            logsContent.innerHTML = `<p class="text-center text-error">加载日志失败: ${result.message}</p>`;
        }
    } catch (error) {
        console.error('加载服务运行日志失败:', error);
        logsContent.innerHTML = '<p class="text-center text-error">加载日志失败</p>';
    }
}

// 清空服务运行日志
async function clearServerLogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/logs`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.utils.showToast('日志清空成功', 'success');
            loadServerLogs();
        } else {
            window.utils.showToast(result.message || '日志清空失败', 'error');
        }
    } catch (error) {
        console.error('清空服务运行日志失败:', error);
        window.utils.showToast('日志清空失败', 'error');
    }
}

// 加载用户数据
async function loadUsers() {
    const onlineUsersList = document.getElementById('onlineUsersList');
    const offlineUsersList = document.getElementById('offlineUsersList');
    
    if (!onlineUsersList || !offlineUsersList) return;
    
    try {
        onlineUsersList.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>加载在线用户...</p></div>';
        offlineUsersList.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>加载离线用户...</p></div>';
        
        // 直接从用户API获取所有用户
        const response = await fetch(`${API_BASE_URL}/user`);
        const usersData = await response.json();
        
        if (usersData.success && usersData.data.users) {
            const allUsers = usersData.data.users;
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
                    const joinedTime = window.utils.formatDate(user.joinedAt || user.createdAt);
                    
                    onlineHtml += `
                        <div class="user-card">
                            <div class="user-avatar" style="background-image: ${user.avatar ? `url(${user.avatar})` : 'linear-gradient(to right, #27ae60, #2ecc71)'};">
                                ${!user.avatar ? user.nickname.charAt(0).toUpperCase() : ''}
                            </div>
                            <div class="user-info">
                                <h4>${user.nickname}</h4>
                                <p>ID: ${user.userId}</p>
                                <p>房间: ${user.roomName || user.roomId || '无'}</p>
                                <p>加入时间: ${joinedTime}</p>
                            </div>
                            <div class="user-actions">
                                <button class="btn btn-sm btn-primary" onclick="window.userManager.openUserEditModal(${JSON.stringify(user).replace(/"/g, '&quot;')})">
                                    <i class="fas fa-edit"></i> 编辑
                                </button>
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
            const recentOfflineUsers = offlineUsers.filter(user => {
                const lastActive = new Date(user.lastActive || user.createdAt);
                return lastActive > oneDayAgo;
            });
            
            if (recentOfflineUsers.length === 0) {
                offlineHtml = '<p class="text-center">暂无最近离线用户</p>';
            } else {
                recentOfflineUsers.forEach(user => {
                    const lastActiveTime = window.utils.formatDate(user.lastActive || user.createdAt);
                    
                    offlineHtml += `
                        <div class="user-card">
                            <div class="user-avatar" style="background-image: ${user.avatar ? `url(${user.avatar})` : 'linear-gradient(to right, #7f8c8d, #95a5a6)'};">
                                ${!user.avatar ? user.nickname.charAt(0).toUpperCase() : ''}
                            </div>
                            <div class="user-info">
                                <h4>${user.nickname}</h4>
                                <p>ID: ${user.userId}</p>
                                <p>房间: ${user.roomName || user.roomId || '无'}</p>
                                <p>最后活动: ${lastActiveTime}</p>
                            </div>
                            <div class="user-actions">
                                <button class="btn btn-sm btn-primary" onclick="window.userManager.openUserEditModal(${JSON.stringify(user).replace(/"/g, '&quot;')})">
                                    <i class="fas fa-edit"></i> 编辑
                                </button>
                            </div>
                            <div class="online-indicator offline"></div>
                        </div>
                    `;
                });
            }
            offlineUsersList.innerHTML = offlineHtml;
        } else {
            onlineUsersList.innerHTML = '<p class="text-center">加载用户数据失败</p>';
            offlineUsersList.innerHTML = '<p class="text-center">加载用户数据失败</p>';
        }
        
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
    init: initUserManager,
    loadUsers,
    loadLogs,
    saveSystemConfig,
    openUserEditModal,
    closeUserEditModal,
    openServerLogsModal,
    closeServerLogsModal,
    loadServerLogs
};