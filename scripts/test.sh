#!/bin/bash

# 测试运行脚本
# 运行单元测试、集成测试、API测试和E2E测试

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 运行后端测试
test_backend() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}运行后端测试${NC}"
    echo -e "${GREEN}========================================${NC}"
    
    cd "$PROJECT_ROOT/backend"
    
    echo -e "${YELLOW}1. 运行单元测试...${NC}"
    npm run test:unit || { echo -e "${RED}单元测试失败${NC}"; exit 1; }
    
    echo -e "${YELLOW}2. 运行集成测试...${NC}"
    npm run test:integration || { echo -e "${RED}集成测试失败${NC}"; exit 1; }
    
    echo -e "${YELLOW}3. 生成覆盖率报告...${NC}"
    npm run coverage || echo -e "${YELLOW}覆盖率生成失败，跳过${NC}"
}

# 运行前端测试
test_frontend() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}运行前端测试${NC}"
    echo -e "${GREEN}========================================${NC}"
    
    cd "$PROJECT_ROOT/frontend"
    
    echo -e "${YELLOW}1. 运行单元测试...${NC}"
    npm run test:unit || { echo -e "${RED}单元测试失败${NC}"; exit 1; }
    
    echo -e "${YELLOW}2. 运行集成测试...${NC}"
    npm run test:integration || { echo -e "${RED}集成测试失败${NC}"; exit 1; }
    
    echo -e "${YELLOW}3. 生成覆盖率报告...${NC}"
    npm run coverage || echo -e "${YELLOW}覆盖率生成失败，跳过${NC}"
}

# 运行 E2E 测试
test_e2e() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}运行 E2E 测试${NC}"
    echo -e "${GREEN}========================================${NC}"
    
    # 启动服务
    echo -e "${YELLOW}启动测试服务...${NC}"
    cd "$PROJECT_ROOT/scripts"
    ./dev.sh start
    sleep 5
    
    # 运行 E2E 测试
    echo -e "${YELLOW}运行前端 E2E 测试...${NC}"
    cd "$PROJECT_ROOT/frontend"
    npx playwright test || { echo -e "${RED}E2E 测试失败${NC}"; exit 1; }
    
    # 停止服务
    echo -e "${YELLOW}停止测试服务...${NC}"
    cd "$PROJECT_ROOT/scripts"
    ./dev.sh stop
}

# 主逻辑
case "${1:-all}" in
    backend)
        test_backend
        ;;
    frontend)
        test_frontend
        ;;
    e2e)
        test_e2e
        ;;
    unit)
        echo -e "${YELLOW}运行单元测试...${NC}"
        cd "$PROJECT_ROOT/backend" && npm run test:unit
        cd "$PROJECT_ROOT/frontend" && npm run test:unit
        ;;
    integration)
        echo -e "${YELLOW}运行集成测试...${NC}"
        cd "$PROJECT_ROOT/backend" && npm run test:integration
        cd "$PROJECT_ROOT/frontend" && npm run test:integration
        ;;
    all)
        test_backend
        test_frontend
        # test_e2e  # 取消注释以启用 E2E 测试
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}所有测试完成!${NC}"
        echo -e "${GREEN}========================================${NC}"
        ;;
    *)
        echo "Usage: ./scripts/test.sh [backend|frontend|e2e|unit|integration|all]"
        ;;
esac