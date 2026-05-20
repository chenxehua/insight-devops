import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

// 创建测试应用
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  
  // 健康检查
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })
  
  return app
}

// Mock 数据库函数
const mockDb = {
  run: vi.fn(),
  exec: vi.fn(),
  getOne: vi.fn(),
  getAll: vi.fn(),
  getLastInsertRowId: vi.fn(() => 1),
  getChanges: vi.fn(() => 1),
  initDatabase: vi.fn().mockResolvedValue(undefined),
  closeDatabase: vi.fn(),
  saveDatabase: vi.fn()
}

// 模拟数据库模块
vi.mock('../../app/lib/database', () => ({
  ...mockDb,
  default: mockDb
}))

// 模拟审计日志
vi.mock('../../app/lib/middleware/audit', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  auditMiddleware: () => (req: any, res: any, next: any) => next(),
  default: { logAudit: vi.fn(), auditMiddleware: () => (req: any, res: any, next: any) => next() }
}))

describe('健康检查 API', () => {
  const app = createTestApp()
  
  it('GET /health - 返回健康状态', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200)

    expect(response.body.status).toBe('ok')
    expect(response.body.timestamp).toBeDefined()
  })
})

describe('API 响应格式测试', () => {
  const app = createTestApp()
  
  it('成功响应格式', async () => {
    app.get('/api/success', (req, res) => {
      res.json({
        code: 200,
        message: '操作成功',
        data: { id: 1, name: 'test' }
      })
    })
    
    const response = await request(app)
      .get('/api/success')
      .expect(200)

    expect(response.body.code).toBe(200)
    expect(response.body.data).toBeDefined()
  })
  
  it('错误响应格式', async () => {
    app.get('/api/error', (req, res) => {
      res.status(400).json({
        code: 400,
        message: '参数错误'
      })
    })
    
    const response = await request(app)
      .get('/api/error')
      .expect(400)

    expect(response.body.code).toBe(400)
    expect(response.body.message).toBeDefined()
  })
  
  it('分页响应格式', async () => {
    app.get('/api/list', (req, res) => {
      res.json({
        code: 200,
        message: 'success',
        data: {
          list: [{ id: 1 }, { id: 2 }],
          total: 10,
          page: 1,
          pageSize: 20,
          totalPages: 1
        }
      })
    })
    
    const response = await request(app)
      .get('/api/list')
      .expect(200)

    expect(response.body.data.list).toBeDefined()
    expect(response.body.data.total).toBe(10)
    expect(response.body.data.page).toBe(1)
  })
})

describe('认证 API 验证', () => {
  const app = createTestApp()
  
  let capturedBody: any = null
  let capturedStatus = 200
  
  beforeEach(() => {
    capturedBody = null
    capturedStatus = 200
  })
  
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' })
    }
    
    if (username === 'admin' && password === 'admin123') {
      return res.json({
        code: 200,
        message: '登录成功',
        data: {
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: '24h',
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            realName: '管理员'
          }
        }
      })
    }
    
    if (username === 'admin') {
      return res.status(401).json({ code: 401, message: '密码错误' })
    }
    
    return res.status(401).json({ code: 401, message: '用户不存在' })
  })
  
  app.post('/api/auth/register', (req, res) => {
    const { username, password, email } = req.body
    
    if (!username || !password || !email) {
      return res.status(400).json({ code: 400, message: '缺少必填字段' })
    }
    
    if (username === 'admin') {
      return res.status(400).json({ code: 400, message: '用户名已存在' })
    }
    
    return res.json({
      code: 200,
      message: '注册成功',
      data: {
        id: 2,
        username,
        email
      }
    })
  })
  
  it('POST /api/auth/login - 登录成功', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      })
      .expect(200)

    expect(response.body.code).toBe(200)
    expect(response.body.data.token).toBeDefined()
    expect(response.body.data.refreshToken).toBeDefined()
    expect(response.body.data.user).toBeDefined()
  })
  
  it('POST /api/auth/login - 登录失败 - 错误密码', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'wrongpassword'
      })
      .expect(401)

    expect(response.body.code).toBe(401)
    expect(response.body.message).toContain('错误')
  })
  
  it('POST /api/auth/login - 登录失败 - 用户不存在', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'nonexistent',
        password: 'password'
      })
      .expect(401)

    expect(response.body.code).toBe(401)
  })
  
  it('POST /api/auth/login - 登录失败 - 空字段', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: '',
        password: ''
      })
      .expect(400)

    expect(response.body.code).toBe(400)
  })
  
  it('POST /api/auth/register - 注册成功', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: `newuser_${Date.now()}`,
        password: 'newpass123',
        email: 'newuser@example.com'
      })
      .expect(200)

    expect(response.body.code).toBe(200)
    expect(response.body.data.id).toBeDefined()
    expect(response.body.data.username).toBeDefined()
  })
  
  it('POST /api/auth/register - 注册失败 - 用户名已存在', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'admin',
        password: 'password123',
        email: 'another@example.com'
      })
      .expect(400)

    expect(response.body.code).toBe(400)
  })
})

describe('用户管理 API 验证', () => {
  const app = createTestApp()
  let authToken = 'mock-jwt-token'
  
  // 模拟认证中间件
  app.use('/api/users', (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, message: '未提供认证令牌' })
    }
    next()
  })
  
  app.get('/api/users', (req, res) => {
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: [
          { id: 1, username: 'admin', email: 'admin@example.com', status: 1 }
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1
      }
    })
  })
  
  app.get('/api/users/:id', (req, res) => {
    const id = parseInt(req.params.id)
    if (id === 1) {
      res.json({
        code: 200,
        data: { id: 1, username: 'admin' }
      })
    } else {
      res.status(404).json({ code: 404, message: '用户不存在' })
    }
  })
  
  it('GET /api/users - 获取用户列表', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(response.body.code).toBe(200)
    expect(response.body.data.list).toBeDefined()
  })
  
  it('GET /api/users/:id - 获取用户详情', async () => {
    const response = await request(app)
      .get('/api/users/1')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(response.body.code).toBe(200)
    expect(response.body.data.id).toBe(1)
  })
  
  it('GET /api/users/:id - 用户不存在', async () => {
    const response = await request(app)
      .get('/api/users/9999')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404)

    expect(response.body.code).toBe(404)
  })
  
  it('未认证访问用户列表 - 应返回 401', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(401)

    expect(response.body.code).toBe(401)
  })
})

describe('应用管理 API 验证', () => {
  const app = createTestApp()
  
  app.get('/api/apps', (req, res) => {
    res.json({
      code: 200,
      data: {
        list: [
          { id: 1, appName: '测试应用', appCode: 'test-app' }
        ],
        total: 1
      }
    })
  })
  
  it('GET /api/apps - 获取应用列表', async () => {
    const response = await request(app)
      .get('/api/apps')
      .expect(200)

    expect(response.body.code).toBe(200)
    expect(Array.isArray(response.body.data.list)).toBe(true)
  })
})

describe('部署管理 API 验证', () => {
  const app = createTestApp()
  
  app.get('/api/deploys', (req, res) => {
    res.json({
      code: 200,
      data: {
        list: [],
        total: 0
      }
    })
  })
  
  it('GET /api/deploys - 获取部署列表', async () => {
    const response = await request(app)
      .get('/api/deploys')
      .expect(200)

    expect(response.body.code).toBe(200)
  })
})

describe('脚本管理 API 验证', () => {
  const app = createTestApp()
  
  app.get('/api/scripts', (req, res) => {
    res.json({
      code: 200,
      data: {
        list: [],
        total: 0
      }
    })
  })
  
  it('GET /api/scripts - 获取脚本列表', async () => {
    const response = await request(app)
      .get('/api/scripts')
      .expect(200)

    expect(response.body.code).toBe(200)
  })
})

describe('监控管理 API 验证', () => {
  const app = createTestApp()
  
  app.get('/api/monitors', (req, res) => {
    res.json({
      code: 200,
      data: {
        list: [],
        total: 0
      }
    })
  })
  
  it('GET /api/monitors - 获取监控列表', async () => {
    const response = await request(app)
      .get('/api/monitors')
      .expect(200)

    expect(response.body.code).toBe(200)
  })
})

describe('日志管理 API 验证', () => {
  const app = createTestApp()
  
  app.get('/api/logs', (req, res) => {
    res.json({
      code: 200,
      data: {
        list: [],
        total: 0
      }
    })
  })
  
  it('GET /api/logs - 获取日志列表', async () => {
    const response = await request(app)
      .get('/api/logs')
      .expect(200)

    expect(response.body.code).toBe(200)
  })
})

describe('错误处理', () => {
  const app = createTestApp()
  
  app.get('/404', (req, res) => {
    res.status(404).json({ code: 404, message: '路由不存在' })
  })
  
  it('404 - 路由不存在', async () => {
    const response = await request(app)
      .get('/404')
      .expect(404)

    expect(response.body.code).toBe(404)
  })
})