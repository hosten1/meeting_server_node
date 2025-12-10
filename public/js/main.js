// 主应用程序逻辑

// 全局DOM元素引用
let menuToggle, sidebar, pageContents, pageTitle, refreshBtn;

// 页面标题映射
const pageTitles = {
    'dashboard-content': '仪表盘',
    'rooms-content': '房间管理',
    'users-content': '用户管理',
    'config-content': '系统配置',
    'logs-content': '操作日志',
    'help-content': '帮助'
};

// 初始化
	document.addEventListener('DOMContentLoaded', function() {
		// 获取DOM元素
		menuToggle = document.getElementById('menuToggle');
		sidebar = document.querySelector('.sidebar');
		pageContents = document.querySelectorAll('.page-content');
		pageTitle = document.getElementById('pageTitle');
		refreshBtn = document.getElementById('refreshData');
		
		// 初始化事件监听器
		initEventListeners();
		
		// 初始化用户管理功能
		window.userManager.init();
		
		// 初始化页面
		initPage();
		
		// 每30秒自动刷新数据
		setInterval(loadDashboard, 30000);
	});

// 初始化事件监听器
function initEventListeners() {
    // 菜单切换
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // 导航菜单点击
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 更新活动菜单项
            navLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应页面
            const pageId = this.id.replace('-link', '-content');
            showPage(pageId);
            
            // 更新页面标题
            if (pageTitle) {
                pageTitle.textContent = pageTitles[pageId] || '仪表盘';
            }
            
            // 如果是小屏幕，点击后关闭侧边栏
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('active');
            }
        });
    });

    // 刷新按钮
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // 获取当前显示的页面ID
            const currentPage = document.querySelector('.page-content:not(.d-none)');
            if (currentPage) {
                const pageId = currentPage.id;
                // 根据当前页面调用对应的刷新函数
                switch(pageId) {
                    case 'dashboard-content':
                        loadDashboard();
                        break;
                    case 'rooms-content':
                        window.roomManager.loadAllRooms();
                        break;
                    case 'users-content':
                        window.userManager.loadUsers();
                        break;
                    case 'logs-content':
                        window.userManager.loadLogs();
                        break;
                }
                window.utils.showToast('数据已刷新', 'success');
            }
        });
    }

    // 查看所有房间按钮
    const viewAllRoomsBtn = document.getElementById('viewAllRooms');
    if (viewAllRoomsBtn) {
        viewAllRoomsBtn.addEventListener('click', function() {
            document.getElementById('rooms-link').click();
            window.roomManager.loadAllRooms();
        });
    }

    // 创建房间按钮
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn) {
        createRoomBtn.addEventListener('click', function() {
            window.roomManager.openRoomEditModal();
        });
    }

    // 模态框关闭按钮
    const closeRoomDetail = document.getElementById('closeRoomDetail');
    if (closeRoomDetail) {
        closeRoomDetail.addEventListener('click', function() {
            window.utils.closeModal('roomDetailModal');
        });
    }

    const closeRoomEdit = document.getElementById('closeRoomEdit');
    if (closeRoomEdit) {
        closeRoomEdit.addEventListener('click', function() {
            window.utils.closeModal('roomEditModal');
        });
    }

    const closeConfirmModal = document.getElementById('closeConfirmModal');
    if (closeConfirmModal) {
        closeConfirmModal.addEventListener('click', function() {
            window.utils.closeModal('confirmModal');
        });
    }

    const cancelRoomEdit = document.getElementById('cancelRoomEdit');
    if (cancelRoomEdit) {
        cancelRoomEdit.addEventListener('click', function() {
            window.utils.closeModal('roomEditModal');
        });
    }

    const cancelConfirm = document.getElementById('cancelConfirm');
    if (cancelConfirm) {
        cancelConfirm.addEventListener('click', function() {
            window.utils.closeModal('confirmModal');
        });
    }

    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === document.getElementById('roomDetailModal')) {
            window.utils.closeModal('roomDetailModal');
        }
        if (e.target === document.getElementById('roomEditModal')) {
            window.utils.closeModal('roomEditModal');
        }
        if (e.target === document.getElementById('userEditModal')) {
            window.utils.closeModal('userEditModal');
        }
        if (e.target === document.getElementById('serverLogsModal')) {
            window.utils.closeModal('serverLogsModal');
        }
        if (e.target === document.getElementById('confirmModal')) {
            window.utils.closeModal('confirmModal');
        }
    });

    // 房间编辑表单提交
    const roomEditForm = document.getElementById('roomEditForm');
    if (roomEditForm) {
        roomEditForm.addEventListener('submit', function(e) {
            e.preventDefault();
            window.roomManager.saveRoom();
        });
    }

    // 系统配置表单提交
    const systemConfigForm = document.getElementById('systemConfigForm');
    if (systemConfigForm) {
        systemConfigForm.addEventListener('submit', function(e) {
            e.preventDefault();
            window.userManager.saveSystemConfig();
        });
    }

    // 重置配置按钮
    const resetConfigBtn = document.getElementById('resetConfig');
    if (resetConfigBtn) {
        resetConfigBtn.addEventListener('click', function() {
            document.getElementById('serverPort').value = 6000;
            document.getElementById('maxUsersPerRoom').value = 50;
            document.getElementById('userOfflineTimeout').value = 30;
            document.getElementById('roomIdleTimeout').value = 60;
            document.getElementById('cleanupInterval').value = 10;
            window.utils.showToast('配置已重置为默认值', 'info');
        });
    }

    // 清空日志按钮
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', function() {
            window.utils.showConfirm('确定要清空所有日志吗？', function() {
                window.utils.showToast('日志已清空', 'success');
                window.userManager.loadLogs();
            });
        });
    }
    
    // 重启服务函数
    window.restartServer = function() {
        window.utils.showConfirm('确定要重启服务器吗？此操作将导致服务暂时不可用。', async function() {
            try {
                window.utils.showToast('正在重启服务器...', 'info');
                
                const response = await fetch(`${API_BASE_URL}/restart`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    window.utils.showToast(result.message, 'success');
                    // 等待3秒后刷新页面
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                } else {
                    window.utils.showToast(result.message, 'error');
                }
            } catch (error) {
                console.error('重启服务器失败:', error);
                window.utils.showToast('重启服务器失败，请检查服务器状态', 'error');
            }
        });
    };
}

// 初始化页面
function initPage() {
    loadDashboard();
    window.utils.checkServerStatus();
}

// 显示页面
function showPage(pageId) {
    pageContents.forEach(page => {
        page.classList.add('d-none');
    });
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('d-none');
    }
    
    // 加载对应页面的数据
    switch(pageId) {
        case 'dashboard-content':
            loadDashboard();
            break;
        case 'rooms-content':
            window.roomManager.loadAllRooms();
            break;
        case 'users-content':
            window.userManager.loadUsers();
            break;
        case 'logs-content':
            window.userManager.loadLogs();
            break;
    }
}

// 加载仪表盘数据
async function loadDashboard() {
    try {
        // 显示加载状态
        const statsContainer = document.getElementById('statsContainer');
        const roomsTableBody = document.getElementById('roomsTableBody');
        
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                    <p>加载统计数据...</p>
                </div>
            `;
        }
        
        if (roomsTableBody) {
            roomsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="loading">
                            <div class="loading-spinner"></div>
                            <p>加载房间数据...</p>
                        </div>
                    </td>
                </tr>
            `;
        }

        // 获取系统统计
        const statsResponse = await fetch(`${API_BASE_URL}/health`);
        const statsData = await statsResponse.json();
        
        // 获取所有房间
        const roomsResponse = await fetch(`${API_BASE_URL}/room`);
        const roomsData = await roomsResponse.json();

        // 更新统计卡片
        window.utils.updateStats(statsData.stats);
        
        // 更新房间表格
        if (roomsData.data.rooms) {
            window.roomManager.updateRoomsTable(roomsData.data.rooms.slice(0, 10));
        }
        
        // 更新系统信息
        window.utils.updateSystemInfo(statsData);
        
    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        
        const statsContainer = document.getElementById('statsContainer');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>错误</h3>
                        <p>无法加载统计数据</p>
                    </div>
                </div>
            `;
        }
        
        const roomsTableBody = document.getElementById('roomsTableBody');
        if (roomsTableBody) {
            roomsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">加载数据失败，请检查网络连接</td>
                </tr>
            `;
        }
        
        window.utils.showToast('加载仪表盘数据失败', 'error');
    }
}