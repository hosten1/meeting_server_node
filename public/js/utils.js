// 工具函数库

// API 基础URL
const API_BASE_URL = '/api';

// 全局状态
window.appState = {
    currentRoomId: null,
    currentAction: null,
    roomsData: [],
    usersData: []
};

// 显示Toast通知
function showToast(message, type = 'info') {
    // 移除已有的toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // 创建toast元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close">&times;</button>
    `;
    
    // 添加到页面
    document.body.appendChild(toast);
    
    // 关闭按钮事件
    toast.querySelector('.toast-close').addEventListener('click', function() {
        toast.remove();
    });
    
    // 3秒后自动消失
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        }
    }, 3000);
}

// 显示确认对话框
function showConfirm(message, callback) {
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmAction = document.getElementById('confirmAction');
    
    confirmMessage.textContent = message;
    
    // 移除旧的事件监听器
    const newConfirmAction = confirmAction.cloneNode(true);
    confirmAction.parentNode.replaceChild(newConfirmAction, confirmAction);
    
    newConfirmAction.onclick = function() {
        confirmModal.style.display = 'none';
        if (callback) callback();
    };
    
    confirmModal.style.display = 'flex';
}

// 关闭模态框
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

// 计算时间间隔
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) return `${diffDay}天前`;
    if (diffHour > 0) return `${diffHour}小时前`;
    if (diffMin > 0) return `${diffMin}分钟前`;
    if (diffSec > 0) return `${diffSec}秒前`;
    return '刚刚';
}

// 检查服务器状态
async function checkServerStatus() {
    const serverStatus = document.getElementById('serverStatus');
    if (!serverStatus) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            serverStatus.textContent = '服务器运行中';
            serverStatus.className = 'status-badge status-active';
        } else {
            serverStatus.textContent = '服务器异常';
            serverStatus.className = 'status-badge status-inactive';
        }
    } catch (error) {
        serverStatus.textContent = '连接失败';
        serverStatus.className = 'status-badge status-inactive';
    }
}

// 更新系统信息
function updateSystemInfo(healthData) {
    const systemInfo = document.getElementById('systemInfo');
    if (!systemInfo) return;
    
    systemInfo.innerHTML = `
        <tr>
            <td width="30%"><strong>服务器状态</strong></td>
            <td><span class="status-badge status-active">运行正常</span></td>
        </tr>
        <tr>
            <td><strong>API版本</strong></td>
            <td>${healthData.version || '1.1.0'}</td>
        </tr>
        <tr>
            <td><strong>最后更新</strong></td>
            <td>${formatDate(new Date())}</td>
        </tr>
        <tr>
            <td><strong>服务器时间</strong></td>
            <td>${formatDate(healthData.timestamp)}</td>
        </tr>
        <tr>
            <td><strong>内存使用</strong></td>
            <td>正常</td>
        </tr>
    `;
}

// 更新统计卡片
function updateStats(stats) {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon rooms-icon">
                <i class="fas fa-door-open"></i>
            </div>
            <div class="stat-info">
                <h3>${stats.rooms || 0}</h3>
                <p>总房间数</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon users-icon">
                <i class="fas fa-users"></i>
            </div>
            <div class="stat-info">
                <h3>${stats.totalUsers || 0}</h3>
                <p>总用户数</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon online-icon">
                <i class="fas fa-user-check"></i>
            </div>
            <div class="stat-info">
                <h3>${stats.onlineUsers || 0}</h3>
                <p>在线用户</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon active-icon">
                <i class="fas fa-broadcast-tower"></i>
            </div>
            <div class="stat-info">
                <h3>${stats.activeRooms || 0}</h3>
                <p>活跃房间</p>
            </div>
        </div>
    `;
}

// 导出API_BASE_URL到全局作用域
window.API_BASE_URL = API_BASE_URL;

// 导出工具函数
window.utils = {
    showToast,
    showConfirm,
    closeModal,
    formatDate,
    timeAgo,
    checkServerStatus,
    updateSystemInfo,
    updateStats
};