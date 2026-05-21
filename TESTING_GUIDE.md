# 测试指南

## 测试策略

本项目采用多层次测试策略，包括单元测试、集成测试、接口测试和端到端测试。

### 测试金字塔

```
         /\
        /  \
       / E2E \       <- Playwright E2E 测试
      /--------\
     / API Test \     <- API 集成测试
    /------------\
   / Unit Tests  \   <- 单元测试
  /----------------\
```

## 测试类型

### 1. 单元测试 (Unit Tests)

**目的**: 验证单个函数、工具类的正确性

**工具**: Vitest

**运行命令**:
```bash
# 后端单元测试
cd backend
npm run test:unit

# 前端单元测试
cd frontend
npm run test:unit
```

**覆盖范围**:
- 工具函数 (auth.ts, common.ts, logger.ts)
- 服务层 (auth.service.ts, user.service.ts)
- Pinia stores
- Vue 组件 (视图)

### 2. 集成测试 (Integration Tests)

**目的**: 验证 API 端点和数据库交互

**工具**: Vitest + Supertest

**运行命令**:
```bash
# 后端集成测试
cd backend
npm run test:integration
```

**覆盖范围**:
- 认证 API (登录、注册、登出)
- 用户管理 API
- 应用管理 API
- 部署管理 API
- 脚本管理 API
- 配置管理 API
- 监控管理 API
- 日志管理 API
- 故障管理 API
- 镜像管理 API
- 备份管理 API
- 巡检管理 API

### 3. 端到端测试 (E2E Tests)

**目的**: 验证完整的用户流程

**工具**: Playwright

**运行命令**:
```bash
# 运行前端 E2E 测试
cd frontend
npx playwright test

# 运行后端 E2E 测试
cd backend
npx playwright test
```

**覆盖范围**:
- 认证流程
- 用户管理流程
- 应用管理流程
- 部署管理流程
- 脚本管理流程
- 导航流程
- 响应式设计
- 性能测试

### 4. 组件测试 (Component Tests)

**目的**: 验证 Vue 组件渲染和行为

**工具**: Vue Test Utils + Vitest

**运行命令**:
```bash
cd frontend
npm run test:unit -- tests/unit/views.spec.ts
```

## 测试文件结构

```
backend/
├── tests/
│   ├── mocks/
│   │   ├── handlers.ts      # MSW 请求处理器
│   │   └── server.ts       # MSW 服务器配置
│   ├── unit/
│   │   ├── auth.test.ts    # 认证工具测试
│   │   ├── common.test.ts  # 通用工具测试
│   │   └── user.service.test.ts  # 用户服务测试
│   ├── integration/
│   │   ├── helpers.ts      # 测试辅助函数
│   │   └── api.test.ts    # API 集成测试
│   ├── e2e/
│   │   └── app.spec.ts    # E2E 测试
│   └── playwright.config.ts
└── vitest.config.ts

frontend/
├── tests/
│   ├── mocks/
│   │   ├── handlers.ts     # MSW 请求处理器
│   │   ├── server.ts       # MSW 服务器配置
│   │   └── stores.ts      # Pinia store mocks
│   ├── unit/
│   │   ├── views.spec.ts   # 视图组件测试
│   │   ├── stores.spec.ts  # Store 测试
│   │   └── api.spec.ts     # API 服务测试
│   ├── integration/
│   │   └── login.spec.ts   # 登录集成测试
│   ├── e2e/
│   │   ├── auth.spec.ts   # 认证 E2E 测试
│   │   └── app.spec.ts    # 应用 E2E 测试
│   └── playwright.config.ts
├── vitest.config.ts
└── tests/setup.ts
```

## 运行所有测试

```bash
# 方式一：分别运行
cd backend && npm run test:unit && npm run test:integration
cd frontend && npm run test:unit && npm run test:integration

# 方式二：使用快捷脚本
cd backend && npm run test:all
cd frontend && npm run test:all
```

## 生成测试报告

```bash
# 后端覆盖率报告
cd backend
npm run coverage

# 前端覆盖率报告
cd frontend
npm run coverage
```

## 编写测试

### 单元测试示例

```typescript
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/utils/auth'

describe('Auth Utils', () => {
  it('hashPassword should hash password', async () => {
    const password = 'test123'
    const hash = await hashPassword(password)
    expect(hash).not.toBe(password)
    expect(hash.length).toBeGreaterThan(0)
  })

  it('verifyPassword should verify correct password', async () => {
    const password = 'test123'
    const hash = await hashPassword(password)
    const isValid = await verifyPassword(password, hash)
    expect(isValid).toBe(true)
  })
})
```

### 集成测试示例

```typescript
import request from 'supertest'
import app from '@/app/server'

describe('User API', () => {
  let authToken: string

  beforeAll(async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
    authToken = response.body.data.token
  })

  it('GET /api/users - should return user list', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
    
    expect(response.body.code).toBe(200)
    expect(Array.isArray(response.body.data.list)).toBe(true)
  })
})
```

### E2E 测试示例

```typescript
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="text"]', 'admin')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('text=欢迎')).toBeVisible()
  })
})
```

## 持续集成

在 CI 环境中运行测试:

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install backend dependencies
        run: cd backend && npm ci
      
      - name: Run backend tests
        run: cd backend && npm run test:all
      
      - name: Install frontend dependencies
        run: cd frontend && npm ci
      
      - name: Run frontend tests
        run: cd frontend && npm run test:all
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 测试数据

测试使用以下默认账户:

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| testuser | test123456 | 普通用户 |

## 调试测试

### 本地调试 Vitest

```bash
# 后端
cd backend
npx vitest --inspect

# 前端
cd frontend
npx vitest --inspect
```

### 本地调试 Playwright

```bash
# 打开 Playwright UI
cd frontend
npx playwright test --ui

# 运行单个测试文件
npx playwright test tests/e2e/auth.spec.ts

# 运行单个测试
npx playwright test tests/e2e/auth.spec.ts --grep "登录成功"
```

## 测试覆盖率目标

- 单元测试覆盖率: 80%+
- 集成测试覆盖所有 API 端点
- E2E 测试覆盖关键用户流程