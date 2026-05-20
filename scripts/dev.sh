#!/bin/bash

# 前后端联调脚本
# 用于同时启动前后端服务进行开发调试

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}错误: 端口 $port 已被占用${NC}"
        return 1
    fi
    return 0
}

# 启动后端服务
start_backend() {
    echo -e "${GREEN}正在启动后端服务...${NC}"
    cd "$PROJECT_ROOT/backend"
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}安装后端依赖...${NC}"
        npm install
    fi
    
    # 启动服务
    npm run dev &
    BACKEND_PID=$!
    echo $BACKEND_PID > /tmp/insight-backend.pid
    
    echo -e "${GREEN}后端服务已启动 (PID: $BACKEND_PID)${NC}"
    echo -e "${GREEN}API 地址: http://localhost:3000/api${NC}"
}

# 启动前端服务
start_frontend() {
    echo -e "${GREEN}正在启动前端服务...${NC}"
    cd "$PROJECT_ROOT/frontend"
    
    # 检查依赖
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}安装前端依赖...${NC}"
        npm install
    fi
    
    # 启动服务
    npm run dev &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > /tmp/insight-frontend.pid
    
    echo -e "${GREEN}前端服务已启动 (PID: $FRONTEND_PID)${NC}"
    echo -e "${GREEN}前端地址: http://localhost:5173${NC}"
}

# 停止服务
stop_services() {
    echo -e "${YELLOW}正在停止服务...${NC}"
    
    if [ -f /tmp/insight-backend.pid ]; then
        kill $(cat /tmp/insight-backend.pid) 2>/dev/null || true
        rm /tmp/insight-backend.pid
        echo -e "${GREEN}后端服务已停止${NC}"
    fi
    
    if [ -f /tmp/insight-frontend.pid ]; then
        kill $(cat /tmp/insight-frontend.pid) 2>/dev/null || true
        rm /tmp/insight-frontend.pid
        echo -e "${GREEN}前端服务已停止${NC}"
    fi
}

# 运行测试
run_tests() {
    echo -e "${GREEN}运行测试...${NC}"
    
    echo -e "${YELLOW}运行后端测试...${NC}"
    cd "$PROJECT_ROOT/backend"
    npm run test:all
    
    echo -e "${YELLOW}运行前端测试...${NC}"
    cd "$PROJECT_ROOT/frontend"
    npm run test:all
}

# 显示帮助
show_help() {
    echo "Usage: ./scripts/dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start       启动前后端服务"
    echo "  stop        停止所有服务"
    echo "  restart     重启所有服务"
    echo "  status      查看服务状态"
    echo "  test        运行所有测试"
    echo "  help        显示帮助"
}

# 显示状态
show_status() {
    echo "服务状态:"
    echo ""
    
    if [ -f /tmp/insight-backend.pid ]; then
        PID=$(cat /tmp/insight-backend.pid)
        if kill -0 $PID 2>/dev/null; then
            echo -e "${GREEN}后端服务: 运行中 (PID: $PID)${NC}"
        else
            echo -e "${RED}后端服务: 未运行${NC}"
        fi
    else
        echo -e "${RED}后端服务: 未运行${NC}"
    fi
    
    if [ -f /tmp/insight-frontend.pid ]; then
        PID=$(cat /tmp/insight-frontend.pid)
        if kill -0 $PID 2>/dev/null; then
            echo -e "${GREEN}前端服务: 运行中 (PID: $PID)${NC}"
        else
            echo -e "${RED}前端服务: 未运行${NC}"
        fi
    else
        echo -e "${RED}前端服务: 未运行${NC}"
    fi
}

# 主逻辑
case "${1:-help}" in
    start)
        check_port 3000 || exit 1
        check_port 5173 || exit 1
        start_backend
        sleep 2
        start_frontend
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}所有服务已启动!${NC}"
        echo -e "${GREEN}前端: http://localhost:5173${NC}"
        echo -e "${GREEN}后端: http://localhost:3000${NC}"
        echo -e "${GREEN}========================================${NC}"
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_backend
        sleep 2
        start_frontend
        ;;
    status)
        show_status
        ;;
    test)
        run_tests
        ;;
    help|*)
        show_help
        ;;
esac