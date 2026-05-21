// 部署管理API集成测试
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

// 创建测试应用
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  return app
}

// 模拟数据库
const mockDb = {
  deployTasks: new Map(),
  apps: new Map([[1, { id: 1, app_name: 'Test App', app_code: 'test-app', status: 1 }]]),
}

// 部署路由模拟
const createDeployRoutes = () => {
  const router = express.Router()
  
  // 列表
  router.get('/', (req, res) => {
    const tasks = Array.from(mockDb.deployTasks.values())
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: tasks.slice((page - 1) * pageSize, page * pageSize),
        total: tasks.length,
        page,
        pageSize,
        totalPages: Math.ceil(tasks.length / pageSize)
      }
    })
  })
  
  // 详情
  router.get('/:id', (req, res) => {
    const task = mockDb.deployTasks.get(parseInt(req.params.id))
    if (!task) {
      return res.status(404).json({ code: 404, message: '部署任务不存在' })
    }
    res.json({ code: 200, message: 'success', data: task })
  })
  
  // 创建
  router.post('/', (req, res) => {
    const { appId, environment, version, strategy } = req.body
    if (!appId || !environment || !version) {
      return res.status(400).json({ code: 400, message: '应用ID、环境和版本不能为空' })
    }
    const id = Date.now()
    const task = { id, appId, environment, version, strategy: strategy || 'normal', status: 'pending' }
    mockDb.deployTasks.set(id, task)
    res.json({ code: 200, message: '创建成功', data: { id } })
  })
  
  // 执行
  router.post('/:id/execute', (req, res) => {
    const task = mockDb.deployTasks.get(parseInt(req.params.id))
    if (!task) {
      return res.status(404).json({ code: 404, message: '部署任务不存在' })
    }
    if (task.status === 'running') {
      return res.status(400).json({ code: 400, message: '部署任务正在执行中' })
    }
    task.status = 'running'
    res.json({ code: 200, message: '部署任务已启动' })
  })
  
  // 取消
  router.post('/:id/cancel', (req, res) => {
    const task = mockDb.deployTasks.get(parseInt(req.params.id))
    if (!task) {
      return res.status(404).json({ code: 404, message: '部署任务不存在' })
    }
    if (task.status === 'success' || task.status === 'failed') {
      return res.status(400).json({ code: 400, message: '已完成的部署任务无法取消' })
    }
    task.status = 'cancelled'
    res.json({ code: 200, message: '部署任务已取消' })
  })
  
  // 回滚
  router.post('/:id/rollback', (req, res) => {
    const task = mockDb.deployTasks.get(parseInt(req.params.id))
    if (!task) {
      return res.status(404).json({ code: 404, message: '部署任务不存在' })
    }
    if (task.status !== 'failed') {
      return res.status(400).json({ code: 400, message: '只能回滚失败的部署任务' })
    }
    task.status = 'rollback'
    res.json({ code: 200, message: '回滚任务已启动' })
  })
  
  // 日志
  router.get('/:id/logs', (req, res) => {
    const task = mockDb.deployTasks.get(parseInt(req.params.id))
    if (!task) {
      return res.status(404).json({ code: 404, message: '部署任务不存在' })
    }
    res.json({
      code: 200,
      message: 'success',
      data: {
        taskId: task.id,
        status: task.status,
        logs: [
          { line: 1, content: 'Starting deployment...', timestamp: new Date().toISOString() }
        ],
        totalLines: 1
      }
    })
  })
  
  return router
}

describe('部署管理 API 测试', () => {
  const app = createTestApp()
  app.use('/api/deploys', createDeployRoutes())
  
  beforeEach(() => {
    mockDb.deployTasks.clear()
    mockDb.deployTasks.set(1, {
      id: 1, appId: 1, appName: 'Test App', environment: 'prod',
      version: 'v1.0.0', strategy: 'normal', status: 'success', progress: 100
    })
  })
  
  describe('GET /api/deploys', () => {
    it('应该返回部署任务列表', async () => {
      const response = await request(app)
        .get('/api/deploys')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.list).toBeDefined()
      expect(response.body.data.total).toBeDefined()
    })
    
    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/deploys?page=2&pageSize=10')
        .expect(200)
      
      expect(response.body.data.page).toBe(2)
      expect(response.body.data.pageSize).toBe(10)
    })
  })
  
  describe('GET /api/deploys/:id', () => {
    it('应该返回部署任务详情', async () => {
      const response = await request(app)
        .get('/api/deploys/1')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.id).toBe(1)
    })
    
    it('任务不存在应返回404', async () => {
      const response = await request(app)
        .get('/api/deploys/9999')
        .expect(404)
      
      expect(response.body.code).toBe(404)
    })
  })
  
  describe('POST /api/deploys', () => {
    it('应该创建新的部署任务', async () => {
      const response = await request(app)
        .post('/api/deploys')
        .send({ appId: 1, environment: 'dev', version: 'v1.0.0' })
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.id).toBeDefined()
    })
    
    it('缺少必填参数应返回400', async () => {
      const response = await request(app)
        .post('/api/deploys')
        .send({ appId: 1 })
        .expect(400)
      
      expect(response.body.code).toBe(400)
    })
  })
  
  describe('POST /api/deploys/:id/execute', () => {
    it('应该执行部署任务', async () => {
      const response = await request(app)
        .post('/api/deploys/1/execute')
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
  })
  
  describe('POST /api/deploys/:id/cancel', () => {
    it('应该取消部署任务', async () => {
      mockDb.deployTasks.get(1).status = 'running'
      const response = await request(app)
        .post('/api/deploys/1/cancel')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(mockDb.deployTasks.get(1).status).toBe('cancelled')
    })
    
    it('已完成的任务无法取消', async () => {
      mockDb.deployTasks.get(1).status = 'success'
      const response = await request(app)
        .post('/api/deploys/1/cancel')
        .expect(400)
      
      expect(response.body.code).toBe(400)
    })
  })
  
  describe('POST /api/deploys/:id/rollback', () => {
    it('应该回滚失败的部署任务', async () => {
      mockDb.deployTasks.get(1).status = 'failed'
      const response = await request(app)
        .post('/api/deploys/1/rollback')
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
    
    it('非失败状态不能回滚', async () => {
      mockDb.deployTasks.get(1).status = 'running'
      const response = await request(app)
        .post('/api/deploys/1/rollback')
        .expect(400)
      
      expect(response.body.code).toBe(400)
    })
  })
  
  describe('GET /api/deploys/:id/logs', () => {
    it('应该返回部署日志', async () => {
      const response = await request(app)
        .get('/api/deploys/1/logs')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.logs).toBeDefined()
    })
  })
})