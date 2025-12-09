#!/bin/bash
# restart-server.sh

set -e

# 配置
PORT=5349
APP_NAME="room-server"
APP_PATH="/home/ubuntu/lym/roomServer"
APP_FILE="server.js"
LOG_FILE="/home/ubuntu/lym/roomServer/restart.log"
PID_FILE="/home/ubuntu/lym/roomServer/server.pid"

# 日志函数
log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# 清理日志中的控制字符
clean_output() {
    echo "$1" | sed 's/\x1b\[[0-9;]*m//g' | tr -d '\n\r'
}

# 检查端口是否被占用
check_port() {
    log "检查端口 $PORT 占用情况..."
    
    # 使用 lsof 检查端口占用
    if command -v lsof &> /dev/null; then
        local pids=$(lsof -i :$PORT -t 2>/dev/null)
        if [ -n "$pids" ]; then
            log "端口 $PORT 被以下进程占用:"
            for pid in $pids; do
                local process_info=$(ps -p $pid -o pid,comm,cmd --no-headers 2>/dev/null)
                if [ -z "$process_info" ]; then
                    process_info="无法获取进程 $pid 信息"
                fi
                log "  PID: $pid - $(clean_output "$process_info")"
            done
            echo "$pids"
            return 0
        else
            log "端口 $PORT 未被占用"
            return 1
        fi
    # 使用 ss 检查
    elif command -v ss &> /dev/null; then
        if ss -tulpn | grep ":$PORT " &> /dev/null; then
            log "端口 $PORT 被占用"
            return 0
        else
            log "端口 $PORT 未被占用"
            return 1
        fi
    # 使用 netstat 检查
    elif command -v netstat &> /dev/null; then
        if netstat -tulpn 2>/dev/null | grep ":$PORT " &> /dev/null; then
            log "端口 $PORT 被占用"
            return 0
        else
            log "端口 $PORT 未被占用"
            return 1
        fi
    else
        log "警告: 未找到端口检测工具(lsof/ss/netstat)"
        return 2
    fi
}

# 检查是否是我们的Node.js进程占用了端口
is_our_node_process() {
    local port=$1
    local our_pids=""
    
    if command -v lsof &> /dev/null; then
        # 获取占用端口的Node进程
        local node_pids=$(lsof -i :$port -t 2>/dev/null)
        
        if [ -n "$node_pids" ]; then
            log "发现Node.js进程占用端口 $port: $node_pids"
            
            # 检查这些进程是否是我们应用的进程
            for pid in $node_pids; do
                # 检查进程命令行是否包含我们的应用文件
                local cmdline=$(ps -p $pid -o cmd --no-headers 2>/dev/null || echo "")
                if echo "$cmdline" | grep -q "$APP_FILE\|server.js"; then
                    log "PID $pid 是我们的应用进程: $(clean_output "$cmdline")"
                    our_pids="$our_pids $pid"
                fi
            done
        fi
    fi
    
    # 移除多余空格并返回
    echo "$our_pids" | xargs
    return 0
}

# 安全地杀死进程
safe_kill() {
    local pid=$1
    local force=${2:-"false"}
    
    # 检查PID是否为数字
    if ! [[ "$pid" =~ ^[0-9]+$ ]]; then
        log "错误: PID '$pid' 不是有效数字"
        return 1
    fi
    
    # 检查进程是否存在
    if ! ps -p $pid &> /dev/null; then
        log "进程 $pid 不存在"
        return 0
    fi
    
    # 获取进程信息
    local process_info=$(ps -p $pid -o pid,comm,cmd --no-headers 2>/dev/null || echo "未知进程")
    log "准备停止进程 $pid: $(clean_output "$process_info")"
    
    # 先尝试优雅停止
    kill -TERM $pid 2>/dev/null
    
    # 等待最多10秒
    local max_wait=10
    local count=0
    
    while ps -p $pid &> /dev/null && [ $count -lt $max_wait ]; do
        sleep 1
        ((count++))
        log "等待进程 $pid 停止... ($count/$max_wait 秒)"
    done
    
    # 如果进程还在，强制杀死
    if ps -p $pid &> /dev/null; then
        if [ "$force" = "true" ]; then
            log "强制杀死进程 $pid"
            kill -9 $pid 2>/dev/null
            sleep 2
        else
            log "进程 $pid 未能优雅停止，跳过强制杀死"
            return 1
        fi
    else
        log "进程 $pid 已停止"
    fi
    
    # 再次确认进程已停止
    if ps -p $pid &> /dev/null; then
        log "警告: 进程 $pid 仍然在运行"
        return 1
    fi
    
    return 0
}

# 清理PID文件
cleanup_pid_file() {
    if [ -f "$PID_FILE" ]; then
        local old_pid=$(cat "$PID_FILE")
        if [ -n "$old_pid" ] && ! ps -p $old_pid &> /dev/null; then
            log "清理旧的PID文件: $old_pid"
            rm -f "$PID_FILE"
        fi
    fi
}

# 启动应用
start_app() {
    cd "$APP_PATH" || {
        log "错误: 无法进入应用目录 $APP_PATH"
        return 1
    }
    
    log "启动应用: $APP_NAME"
    
    # 检查应用文件是否存在
    if [ ! -f "$APP_FILE" ]; then
        log "错误: 应用文件 $APP_FILE 不存在"
        return 1
    fi
    
    # 清理旧的日志（可选）
    if [ -f "node.log" ]; then
        log "备份旧的日志文件"
        mv "node.log" "node.log.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
    fi
    
    # 启动Node.js应用
    log "运行: node $APP_FILE"
    
    # 使用nohup在后台运行
    nohup node "$APP_FILE" >> node.log 2>&1 &
    
    local new_pid=$!
    echo $new_pid > "$PID_FILE"
    
    log "应用已启动，PID: $new_pid"
    log "PID已保存到: $PID_FILE"
    
    # 等待应用启动
    sleep 3
    
    # 检查应用是否成功启动
    if ! ps -p $new_pid &> /dev/null; then
        log "错误: 应用进程 $new_pid 已退出"
        if [ -f "node.log" ]; then
            log "查看日志文件:"
            tail -20 node.log
        fi
        rm -f "$PID_FILE"
        return 1
    fi
    
    # 检查端口是否被监听
    local max_checks=10
    local check_count=0
    
    while [ $check_count -lt $max_checks ]; do
        if check_port &> /dev/null; then
            local listening_pid=$(lsof -i :$PORT -t 2>/dev/null | head -1)
            if [ "$listening_pid" = "$new_pid" ]; then
                log "✓ 应用成功启动并在监听端口 $PORT"
                return 0
            fi
        fi
        sleep 2
        ((check_count++))
    done
    
    log "警告: 应用已启动但未检测到监听端口 $PORT"
    log "检查应用日志:"
    tail -30 node.log 2>/dev/null || true
    return 1
}

# 主函数
main() {
    log "=== 开始重启脚本 ==="
    log "应用: $APP_NAME"
    log "端口: $PORT"
    log "路径: $APP_PATH"
    
    # 清理旧的PID文件
    cleanup_pid_file
    
    # 检查端口占用
    if check_port; then
        log "端口 $PORT 被占用，检查是否是我们自己的进程..."
        
        # 获取占用端口的我们的Node.js进程
        local our_pids=$(is_our_node_process $PORT)
        
        if [ -n "$our_pids" ]; then
            log "发现我们自己的进程占用端口: $our_pids"
            
            # 杀死我们的旧进程
            for pid in $our_pids; do
                # 确保pid是数字
                if [[ "$pid" =~ ^[0-9]+$ ]]; then
                    log "停止我们自己的进程: $pid"
                    safe_kill $pid "true"
                else
                    log "跳过无效PID: $pid"
                fi
            done
            
            # 等待端口释放
            local max_wait=5
            local count=0
            
            while check_port && [ $count -lt $max_wait ]; do
                sleep 1
                ((count++))
                log "等待端口 $PORT 释放... ($count/$max_wait 秒)"
            done
            
            if check_port; then
                log "警告: 端口 $PORT 仍然被占用，可能不是我们的进程"
            fi
        else
            log "端口 $PORT 被其他进程占用"
            
            # 显示占用端口的进程信息
            log "占用端口的进程信息:"
            if command -v lsof &> /dev/null; then
                lsof -i :$PORT
            elif command -v ss &> /dev/null; then
                ss -tulpn | grep ":$PORT "
            fi
            
            # 询问用户是否继续
            read -p "端口被其他进程占用，是否继续？(y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log "用户取消操作"
                exit 1
            fi
        fi
    else
        log "端口 $PORT 可用，继续启动..."
    fi
    
    # 启动应用
    if start_app; then
        log "✓ 应用启动成功"
        log "日志文件: $APP_PATH/node.log"
        log "PID文件: $PID_FILE"
        
        # 显示应用状态
        sleep 2
        log "当前应用状态:"
        if [ -f "$PID_FILE" ]; then
            local current_pid=$(cat "$PID_FILE")
            if ps -p $current_pid &> /dev/null; then
                ps -p $current_pid -o pid,user,pcpu,pmem,vsz,rss,comm,cmd --no-headers
            fi
        fi
        
        log "端口监听状态:"
        if check_port; then
            lsof -i :$PORT
        fi
    else
        log "✗ 应用启动失败"
        exit 1
    fi
    
    log "=== 重启脚本完成 ==="
}

# 执行主函数
main "$@"