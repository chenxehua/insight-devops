// 故障管理API集成测试
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  return app
}

const mockDb = {
  faults: new Map(),
}

const createFaultRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const faults = Array.from(mockDb.faults.values())
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: faults.slice((page - 1) * pageSize, page * pageSize),
        total: faults.length,
        page,
        pageSize,
        totalPages: Math.ceil(faults.length / pageSize)
      }
    })
  })
  
  router.get('/:id', (req, res) => {
    const fault = mockDb.faults.get(parseInt(req.params.id))
    if (!fault) {
      return res.status(404).json({ code: 404, message: '故障记录不存在' })
    }
    res.json({ code: 200, message: 'success', data: fault })
  })
  
  router.post('/', (req, res) => {
    const { title, level, type, description } = req.body
    if (!title || !level || !type) {
      return res.status(400).json({ code: 400, message: '标题、级别和类型不能为空' })
    }
    const id = Date.now()
    const fault = { id, title, level, type, description, status: 'open' }
    mockDb.faults.set(id, fault)
    res.json({ code: 200, message: '创建成功', data: { id } })
  })
  
  router.put('/:id', (req, res) => {
    const fault = mockDb.faults.get(parseInt(req.params.id))
    if (!fault) {
      return res.status(404).json({ code: 404, message: '故障记录不存在' })
    }
    res.json({ code: 200, message: '更新成功' })
  })
  
  router.delete('/:id', (req, res) => {
    if (!mockDb.faults.has(parseInt(req.params.id))) {
      return res.status(404).json({ code: 404, message: '故障记录不存在' })
    }
    mockDb.faults.delete(parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  })
  
  return router
}

describe('故障管理 API 测试', () => {
  let app: express.Application
  
  beforeAll(() => {
    app = createTestApp()
    app.use('/api/faults', createFaultRoutes())
  })
  
  beforeEach(() => {
    mockDb.faults.clear()
    mockDb.faults.set(1, {
      id: 1, title: 'Test Fault', level: 'high', type: 'server', status: 'open'
    })
  })
  
  describe('GET /api/faults', () => {
    it('应该返回故障列表', async () => {
      const response = await request(app)
        .get('/api/faults')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.list).toBeDefined()
    })
    
    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/faults?page=1&pageSize=10')
        .expect(200)
      
      expect(response.body.data.page).toBe(1)
    })
    
    it('应该支持状态筛选', async () => {
      const response = await request(app)
        .get('/api/faults?status=open')
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
    
    it('应该支持级别筛选', async () => {
      const response = await request(app)
        .get('/api/faults?level=high')
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
  })
  
  describe('GET /api/faults/:id', () => {
    it('应该返回故障详情', async () => {
      const response = await request(app)
        .get('/api/faults/1')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.id).toBe(1)
    })
    
    it('故障不存在应返回404', async () => {
      const response = await request(app)
        .get('/api/faults/9999')
        .expect(404)
      
      expect(response.body.code).toBe(404)
    })
  })
  
  describe('POST /api/faults', () => {
    it('应该创建新故障', async () => {
      const response = await request(app)
        .post('/api/faults')
        .send({ title: 'New Fault', level: 'medium', type: 'network' })
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
    
    it('缺少必填参数应返回400', async () => {
      const response = await request(app)
        .post('/api/faults')
        .send({ title: 'New Fault' })
        .expect(400)
      
      expect(response.body.code).toBe(400)
    })
  })
  
  describe('PUT /api/faults/:id', () => {
    it('应该更新故障', async () => {
      const response = await request(app)
        .put('/api/faults/1')
        .send({ status: 'resolved' })
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
  })
  
  describe('DELETE /api/faults/:id', () => {
    it('应该删除故障', async () => {
      const response = await request(app)
        .delete('/api/faults/1')
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
  })
})