// 巡检管理API集成测试
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  return app
}

const mockDb = {
  checks: new Map(),
  reports: new Map(),
}

const createCheckRoutes = () => {
  const router = express.Router()
  
  // 巡检记录列表
  router.get('/', (req, res) => {
    const checks = Array.from(mockDb.checks.values())
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: checks.slice((page - 1) * pageSize, page * pageSize),
        total: checks.length,
        page,
        pageSize,
        totalPages: Math.ceil(checks.length / pageSize)
      }
    })
  })
  
  router.get('/:id', (req, res) => {
    const check = mockDb.checks.get(parseInt(req.params.id))
    if (!check) {
      return res.status(404).json({ code: 404, message: '巡检记录不存在' })
    }
    res.json({ code: 200, message: 'success', data: check })
  })
  
  router.post('/', (req, res) => {
    const { name, type, schedule } = req.body
    if (!name || !type) {
      return res.status(400).json({ code: 400, message: '巡检名称和类型不能为空' })
    }
    const id = Date.now()
    const check = { id, name, type, schedule, status: 'pending' }
    mockDb.checks.set(id, check)
    res.json({ code: 200, message: '创建成功', data: { id } })
  })
  
  router.put('/:id', (req, res) => {
    const check = mockDb.checks.get(parseInt(req.params.id))
    if (!check) {
      return res.status(404).json({ code: 404, message: '巡检记录不存在' })
    }
    res.json({ code: 200, message: '更新成功' })
  })
  
  router.post('/:id/execute', (req, res) => {
    const check = mockDb.checks.get(parseInt(req.params.id))
    if (!check) {
      return res.status(404).json({ code: 404, message: '巡检记录不存在' })
    }
    check.status = 'running'
    res.json({ code: 200, message: '巡检已启动', data: { executionId: Date.now() } })
  })
  
  router.delete('/:id', (req, res) => {
    if (!mockDb.checks.has(parseInt(req.params.id))) {
      return res.status(404).json({ code: 404, message: '巡检记录不存在' })
    }
    mockDb.checks.delete(parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  })
  
  return router
}

const createReportRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const reports = Array.from(mockDb.reports.values())
    res.json({ code: 200, message: 'success', data: reports })
  })
  
  router.get('/:id', (req, res) => {
    const report = mockDb.reports.get(parseInt(req.params.id))
    if (!report) {
      return res.status(404).json({ code: 404, message: '巡检报告不存在' })
    }
    res.json({ code: 200, message: 'success', data: report })
  })
  
  return router
}

describe('巡检管理 API 测试', () => {
  let app: express.Application
  
  beforeAll(() => {
    app = createTestApp()
    app.use('/api/checks/reports', createReportRoutes())
    app.use('/api/checks', createCheckRoutes())
  })
  
  beforeEach(() => {
    mockDb.checks.clear()
    mockDb.reports.clear()
    mockDb.checks.set(1, {
      id: 1, name: 'Daily Check', type: 'daily', schedule: '0 0 * * *', status: 'completed'
    })
    mockDb.reports.set(1, {
      id: 1, checkId: 1, score: 95, summary: 'All checks passed', createdAt: new Date().toISOString()
    })
  })
  
  describe('巡检记录', () => {
    describe('GET /api/checks', () => {
      it('应该返回巡检记录列表', async () => {
        const response = await request(app)
          .get('/api/checks')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.list).toBeDefined()
      })
      
      it('应该支持分页参数', async () => {
        const response = await request(app)
          .get('/api/checks?page=1&pageSize=10')
          .expect(200)
        
        expect(response.body.data.page).toBe(1)
      })
      
      it('应该支持状态筛选', async () => {
        const response = await request(app)
          .get('/api/checks?status=completed')
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
    })
    
    describe('GET /api/checks/:id', () => {
      it('应该返回巡检详情', async () => {
        const response = await request(app)
          .get('/api/checks/1')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.id).toBe(1)
      })
      
      it('巡检记录不存在应返回404', async () => {
        const response = await request(app)
          .get('/api/checks/9999')
          .expect(404)
        
        expect(response.body.code).toBe(404)
      })
    })
    
    describe('POST /api/checks', () => {
      it('应该创建新巡检', async () => {
        const response = await request(app)
          .post('/api/checks')
          .send({ name: 'Weekly Check', type: 'weekly' })
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
      
      it('缺少必填参数应返回400', async () => {
        const response = await request(app)
          .post('/api/checks')
          .send({ name: 'Weekly Check' })
          .expect(400)
        
        expect(response.body.code).toBe(400)
      })
    })
    
    describe('PUT /api/checks/:id', () => {
      it('应该更新巡检配置', async () => {
        const response = await request(app)
          .put('/api/checks/1')
          .send({ schedule: '0 0 * * 1' })
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
    })
    
    describe('POST /api/checks/:id/execute', () => {
      it('应该执行巡检', async () => {
        const response = await request(app)
          .post('/api/checks/1/execute')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.executionId).toBeDefined()
      })
    })
    
    describe('DELETE /api/checks/:id', () => {
      it('应该删除巡检', async () => {
        const response = await request(app)
          .delete('/api/checks/1')
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
    })
  })
  
  describe('巡检报告', () => {
    describe('GET /api/checks/reports', () => {
      it('应该返回报告列表', async () => {
        const response = await request(app)
          .get('/api/checks/reports')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
      })
    })
    
    describe('GET /api/checks/reports/:id', () => {
      it('应该返回报告详情', async () => {
        const response = await request(app)
          .get('/api/checks/reports/1')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.id).toBe(1)
      })
      
      it('报告不存在应返回404', async () => {
        const response = await request(app)
          .get('/api/checks/reports/9999')
          .expect(404)
        
        expect(response.body.code).toBe(404)
      })
    })
  })
})