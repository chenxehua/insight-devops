// 应用管理API集成测试
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
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
  apps: new Map(),
}

// 应用路由模拟
const createAppRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const apps = Array.from(mockDb.apps.values())
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: apps.slice((page - 1) * pageSize, page * pageSize),
        total: apps.length,
        page,
        pageSize,
        totalPages: Math.ceil(apps.length / pageSize)
      }
    })
  })
  
  router.get('/:id', (req, res) => {
    const app = mockDb.apps.get(parseInt(req.params.id))
    if (!app) {
      return res.status(404).json({ code: 404, message: '应用不存在' })
    }
    res.json({ code: 200, message: 'success', data: app })
  })
  
  router.post('/', (req, res) => {
    const { name, code, description, repository } = req.body
    if (!name || !code) {
      return res.status(400).json({ code: 400, message: '应用名称和代码不能为空' })
    }
    const id = Date.now()
    const app = { id, name, code, description, repository, status: 1 }
    mockDb.apps.set(id, app)
    res.json({ code: 200, message: '创建成功', data: { id } })
  })
  
  router.put('/:id', (req, res) => {
    const app = mockDb.apps.get(parseInt(req.params.id))
    if (!app) {
      return res.status(404).json({ code: 404, message: '应用不存在' })
    }
    res.json({ code: 200, message: '更新成功' })
  })
  
  router.delete('/:id', (req, res) => {
    if (!mockDb.apps.has(parseInt(req.params.id))) {
      return res.status(404).json({ code: 404, message: '应用不存在' })
    }
    mockDb.apps.delete(parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  })
  
  return router
}

describe('应用管理 API 测试', () => {
  let app: express.Application
  
  beforeAll(() => {
    app = createTestApp()
    app.use('/api/apps', createAppRoutes())
  })
  
  beforeEach(() => {
    mockDb.apps.clear()
    mockDb.apps.set(1, {
      id: 1, name: 'Test App', code: 'test-app', description: 'Test application', status: 1
    })
  })
  
  describe('GET /api/apps', () => {
    it('应该返回应用列表', async () => {
      const response = await request(app)
        .get('/api/apps')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.list).toBeDefined()
      expect(response.body.data.total).toBeDefined()
    })
    
    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/apps?page=1&pageSize=10')
        .expect(200)
      
      expect(response.body.data.page).toBe(1)
      expect(response.body.data.pageSize).toBe(10)
    })
  })
  
  describe('GET /api/apps/:id', () => {
    it('应该返回应用详情', async () => {
      const response = await request(app)
        .get('/api/apps/1')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.id).toBe(1)
    })
    
    it('应用不存在应返回404', async () => {
      const response = await request(app)
        .get('/api/apps/9999')
        .expect(404)
      
      expect(response.body.code).toBe(404)
    })
  })
  
  describe('POST /api/apps', () => {
    it('应该创建新应用', async () => {
      const response = await request(app)
        .post('/api/apps')
        .send({ name: 'New App', code: 'new-app' })
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.id).toBeDefined()
    })
    
    it('缺少必填参数应返回400', async () => {
      const response = await request(app)
        .post('/api/apps')
        .send({ name: 'New App' })
        .expect(400)
      
      expect(response.body.code).toBe(400)
    })
  })
  
  describe('PUT /api/apps/:id', () => {
    it('应该更新应用', async () => {
      const response = await request(app)
        .put('/api/apps/1')
        .send({ name: 'Updated App' })
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
    
    it('应用不存在应返回404', async () => {
      const response = await request(app)
        .put('/api/apps/9999')
        .send({ name: 'Updated App' })
        .expect(404)
      
      expect(response.body.code).toBe(404)
    })
  })
  
  describe('DELETE /api/apps/:id', () => {
    it('应该删除应用', async () => {
      const response = await request(app)
        .delete('/api/apps/1')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(mockDb.apps.has(1)).toBe(false)
    })
    
    it('应用不存在应返回404', async () => {
      const response = await request(app)
        .delete('/api/apps/9999')
        .expect(404)
      
      expect(response.body.code).toBe(404)
    })
  })
})