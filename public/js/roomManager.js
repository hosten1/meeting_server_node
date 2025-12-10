// 房间管理功能

// 更新房间表格
function updateRoomsTable(rooms, tableId = 'roomsTableBody') {
    const tbody = document.getElementById(tableId);
    if (!tbody) return;
    
    if (!rooms || rooms.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">暂无房间数据</td>
            </tr>
        `;
        return;
    }
    
    let rows = '';
    rooms.forEach(room => {
        const createTime = window.utils.formatDate(room.createdAt);
        const statusClass = room.isActive ? 'status-active' : 'status-inactive';
        const statusText = room.isActive ? '活跃' : '闲置';
        
        rows += `
            <tr>
                <td><strong>${room.roomId}</strong></td>
                <td>${room.roomName}</td>
                <td>${room.creator}</td>
                <td>${room.userCount}/${room.maxUsers}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${createTime}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-view" onclick="viewRoomDetail('${room.roomId}')">
                            <i class="fas fa-eye"></i> 查看
                        </button>
                        <button class="btn btn-delete" onclick="deleteRoom('${room.roomId}', '${room.roomName}')">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = rows;
}

// 加载所有房间
async function loadAllRooms() {
    const allRoomsTableBody = document.getElementById('allRoomsTableBody');
    if (!allRoomsTableBody) return;
    
    try {
        allRoomsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="loading">
                        <div class="loading-spinner"></div>
                        <p>加载房间数据...</p>
                    </div>
                </td>
            </tr>
        `;

        const response = await fetch(`${API_BASE_URL}/room`);
        const data = await response.json();
        
        window.appState.roomsData = data.data.rooms || [];
        
        let rows = '';
        if (window.appState.roomsData.length === 0) {
            rows = `<tr><td colspan="8" class="text-center">暂无房间数据</td></tr>`;
        } else {
            window.appState.roomsData.forEach(room => {
                const createTime = window.utils.formatDate(room.createdAt);
                const lastActive = window.utils.formatDate(room.lastActive);
                const statusClass = room.isActive ? 'status-active' : 'status-inactive';
                const statusText = room.isActive ? '活跃' : '闲置';
                
                rows += `
                    <tr>
                        <td><strong>${room.roomId}</strong></td>
                        <td>${room.roomName}</td>
                        <td>${room.creator}</td>
                        <td>${room.userCount}/${room.maxUsers}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>${createTime}</td>
                        <td>${lastActive}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-view" onclick="viewRoomDetail('${room.roomId}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-edit" onclick="editRoom('${room.roomId}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-delete" onclick="deleteRoom('${room.roomId}', '${room.roomName}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
        
        allRoomsTableBody.innerHTML = rows;
    } catch (error) {
        console.error('加载房间数据失败:', error);
        allRoomsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">加载数据失败，请检查网络连接</td>
            </tr>
        `;
        window.utils.showToast('加载房间数据失败', 'error');
    }
}

// 查看房间详情
async function viewRoomDetail(roomId) {
    window.appState.currentRoomId = roomId;
    
    try {
        const response = await fetch(`${API_BASE_URL}/room/${roomId}`);
        const data = await response.json();
        
        if (data.success) {
            const room = data.data;
            const createTime = window.utils.formatDate(room.createdAt);
            const lastActive = window.utils.formatDate(room.lastActive);
            
            // 获取房间用户
            const usersResponse = await fetch(`${API_BASE_URL}/room/${roomId}/users`);
            const usersData = await usersResponse.json();
            
            let usersHtml = '';
            if (usersData.success && usersData.data.users) {
                usersData.data.users.forEach(user => {
                    const joinedTime = window.utils.formatDate(user.joinedAt);
                    const lastActiveTime = window.utils.formatDate(user.lastActive);
                    
                    usersHtml += `
                        <div class="user-card">
                            <div class="user-avatar">${user.nickname.charAt(0).toUpperCase()}</div>
                            <div class="user-info">
                                <h4>${user.nickname}</h4>
                                <p>ID: ${user.userId}</p>
                                <p>加入时间: ${joinedTime}</p>
                                <p>最后活动: ${lastActiveTime}</p>
                            </div>
                            <div class="online-indicator ${user.isOnline ? 'online' : 'offline'}"></div>
                            <button class="btn btn-kick" onclick="kickUser('${user.userId}', '${roomId}')">
                                <i class="fas fa-user-slash"></i>
                            </button>
                        </div>
                    `;
                });
            } else {
                usersHtml = '<p class="text-center">暂无用户数据</p>';
            }
            
            document.getElementById('roomDetailTitle').textContent = `房间详情 - ${room.roomName}`;
            
            document.getElementById('roomDetailContent').innerHTML = `
                <div class="form-group">
                    <label>房间ID</label>
                    <p><strong>${room.roomId}</strong></p>
                </div>
                <div class="form-group">
                    <label>房间名称</label>
                    <p>${room.roomName}</p>
                </div>
                <div class="form-group">
                    <label>创建者</label>
                    <p>${room.creator}</p>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>创建时间</label>
                        <p>${createTime}</p>
                    </div>
                    <div class="form-group">
                        <label>最后活动</label>
                        <p>${lastActive}</p>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>用户数</label>
                        <p>${room.userCount} / ${room.maxUsers}</p>
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <p><span class="status-badge ${room.isActive ? 'status-active' : 'status-inactive'}">
                            ${room.isActive ? '活跃' : '闲置'}
                        </span></p>
                    </div>
                </div>
                <h4>媒体服务配置</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label>服务器地址</label>
                        <p>${room.mediaConfig.host}:${room.mediaConfig.port}</p>
                    </div>
                    <div class="form-group">
                        <label>协议</label>
                        <p>${room.mediaConfig.protocol.toUpperCase()}</p>
                    </div>
                </div>
                <h4>房间用户 (${room.userCount}人)</h4>
                <div class="user-list">
                    ${usersHtml}
                </div>
                <div class="form-footer text-right mt-20">
                    <button class="btn btn-secondary" onclick="window.utils.closeModal('roomDetailModal')">关闭</button>
                    <button class="btn btn-primary" onclick="editRoom('${room.roomId}')">编辑房间</button>
                </div>
            `;
            
            document.getElementById('roomDetailModal').style.display = 'flex';
        } else {
            window.utils.showToast('获取房间信息失败', 'error');
        }
    } catch (error) {
        console.error('获取房间详情失败:', error);
        window.utils.showToast('获取房间信息失败', 'error');
    }
}

// 编辑房间
async function editRoom(roomId) {
    window.appState.currentRoomId = roomId;
    
    try {
        const response = await fetch(`${API_BASE_URL}/room/${roomId}`);
        const data = await response.json();
        
        if (data.success) {
            const room = data.data;
            
            document.getElementById('roomEditTitle').textContent = '编辑房间';
            document.getElementById('editRoomId').value = room.roomId;
            document.getElementById('editRoomId').readOnly = true;
            document.getElementById('editRoomName').value = room.roomName;
            document.getElementById('editCreatorId').value = room.creator;
            document.getElementById('editCreatorId').readOnly = true;
            document.getElementById('editCreatorNickname').value = room.creator;
            document.getElementById('editMaxUsers').value = room.maxUsers;
            
            // 媒体配置
            if (room.mediaConfig) {
                document.getElementById('editMediaHost').value = room.mediaConfig.host;
                document.getElementById('editMediaPort').value = room.mediaConfig.port;
                document.getElementById('editMediaProtocol').value = room.mediaConfig.protocol;
            }
            
            document.getElementById('roomEditModal').style.display = 'flex';
            window.utils.closeModal('roomDetailModal');
        } else {
            window.utils.showToast('获取房间信息失败', 'error');
        }
    } catch (error) {
        console.error('获取房间信息失败:', error);
        window.utils.showToast('获取房间信息失败', 'error');
    }
}

// 打开创建房间模态框
function openRoomEditModal() {
    document.getElementById('roomEditTitle').textContent = '创建房间';
    document.getElementById('editRoomId').value = '';
    document.getElementById('editRoomId').readOnly = false;
    document.getElementById('editRoomName').value = '';
    document.getElementById('editCreatorId').value = '';
    document.getElementById('editCreatorId').readOnly = false;
    document.getElementById('editCreatorNickname').value = '';
    document.getElementById('editMaxUsers').value = 50;
    
    // 重置媒体配置
    document.getElementById('editMediaHost').value = 'localhost';
    document.getElementById('editMediaPort').value = 6000;
    document.getElementById('editMediaProtocol').value = 'https';
    
    document.getElementById('roomEditModal').style.display = 'flex';
}

// 保存房间
async function saveRoom() {
    const roomId = document.getElementById('editRoomId').value.trim();
    const roomName = document.getElementById('editRoomName').value.trim();
    const creatorId = document.getElementById('editCreatorId').value.trim();
    const creatorNickname = document.getElementById('editCreatorNickname').value.trim() || creatorId;
    const maxUsers = parseInt(document.getElementById('editMaxUsers').value);
    
    const mediaConfig = {
        host: document.getElementById('editMediaHost').value.trim(),
        port: parseInt(document.getElementById('editMediaPort').value),
        protocol: document.getElementById('editMediaProtocol').value
    };
    
    if (!roomId || !roomName || !creatorId) {
        window.utils.showToast('请填写完整的房间信息', 'error');
        return;
    }
    
    try {
        // 检查是创建还是更新
        const isEdit = document.getElementById('roomEditTitle').textContent === '编辑房间';
        
        let response;
        if (isEdit) {
            // 更新房间媒体配置
            const updateData = {
                mediaConfig: mediaConfig
            };
            
            response = await fetch(`${API_BASE_URL}/room/${roomId}/media-config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: creatorId,
                    ...updateData
                })
            });
            
            if (response.ok) {
                window.utils.showToast('房间配置已更新', 'success');
                window.utils.closeModal('roomEditModal');
                loadAllRooms();
            }
        } else {
            // 创建房间
            const roomData = {
                roomId: roomId,
                userId: creatorId,
                nickname: creatorNickname,
                roomName: roomName,
                mediaConfig: mediaConfig
            };
            
            response = await fetch(`${API_BASE_URL}/room/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(roomData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.utils.showToast('房间创建成功', 'success');
                window.utils.closeModal('roomEditModal');
                loadAllRooms();
            } else {
                window.utils.showToast(`创建失败: ${result.message}`, 'error');
            }
        }
    } catch (error) {
        console.error('保存房间失败:', error);
        window.utils.showToast('保存房间失败，请检查网络连接', 'error');
    }
}

// 删除房间
function deleteRoom(roomId, roomName) {
    window.appState.currentRoomId = roomId;
    window.appState.currentAction = 'deleteRoom';
    
    window.utils.showConfirm(`确定要删除房间 "${roomName}" (${roomId}) 吗？此操作将解散房间并移除所有用户。`, async function() {
        try {
            const userId = 'admin'; // 默认管理员ID
            
            const response = await fetch(`${API_BASE_URL}/room/disband`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomId: roomId,
                    userId: userId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.utils.showToast('房间删除成功', 'success');
                loadAllRooms();
            } else {
                window.utils.showToast(`删除失败: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('删除房间失败:', error);
            window.utils.showToast('删除房间失败', 'error');
        }
    });
}

// 踢出用户
function kickUser(userId, roomId) {
    window.appState.currentRoomId = roomId;
    
    window.utils.showConfirm(`确定要将用户 ${userId} 踢出房间吗？`, async function() {
        try {
            const response = await fetch(`${API_BASE_URL}/room/leave`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomId: roomId,
                    userId: userId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                window.utils.showToast('用户已踢出房间', 'success');
                // 刷新房间详情
                viewRoomDetail(roomId);
            } else {
                window.utils.showToast(`操作失败: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('踢出用户失败:', error);
            window.utils.showToast('踢出用户失败', 'error');
        }
    });
}

// 导出房间管理函数
window.roomManager = {
    updateRoomsTable,
    loadAllRooms,
    viewRoomDetail,
    editRoom,
    openRoomEditModal,
    saveRoom,
    deleteRoom,
    kickUser
};