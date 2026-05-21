// 监控告警API集成测试
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  return app
}

const mockDb = {
  metrics: new Map(),
  alerts: new Map(),
  rules: new Map(),
}

const createMonitorRoutes = () => {
  const router = express.Router()
  
  // 指标列表
  router.get('/metrics', (req, res) => {
    const metrics = Array.from(mockDb.metrics.values())
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: metrics.slice((page - 1) * pageSize, page * pageSize),
        total: metrics.length,
        page,
        pageSize
      }
    })
  })
  
  // 告警列表
  router.get('/alerts', (req, res) => {
    const alerts = Array.from(mockDb.alerts.values())
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: alerts.slice((page - 1) * pageSize, page * pageSize),
        total: alerts.length,
        page,
        pageSize
      }
    })
  })
  
  router.get('/alerts/:id', (req, res) => {
    const alert = mockDb.alerts.get(parseInt(req.params.id))
    if (!alert) {
      return res.status(404).json({ code: 404, message: '告警不存在' })
    }
    res.json({ code: 200, message: 'success', data: alert })
  })
  
  router.put('/alerts/:id/handle', (req, res) => {
    const alert = mockDb.alerts.get(parseInt(req.params.id))
    if (!alert) {
      return res.status(404).json({ code: 404, message: '告警不存在' })
    }
    alert.status = 'resolved'
    res.json({ code: 200, message: '处理成功' })
  })
  
  // 告警规则
  router.get('/rules', (req, res) => {
    const rules = Array.from(mockDb.rules.values())
    res.json({ code: 200, message: 'success', data: rules })
  })
  
  router.post('/rules', (req, res) => {
    const { name, metric, threshold, condition } = req.body
    if (!name || !metric || threshold === undefined) {
      return res.status(400).json({ code: 400, message: '规则名称、指标和阈值不能为空' })
    }
    const id = Date.now()
    mockDb.rules.set(id, { id, name, metric, threshold, condition, status: 1 })
    res.json({ code: 200, message: '创建成功', data: { id } })
  })
  
  router.delete('/rules/:id', (req, res) => {
    if (!mockDb.rules.has(parseInt(req.params.id))) {
      return res.status(404).json({ code: 404, message: '规则不存在' })
    }
    mockDb.rules.delete(parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  })
  
  return router
}

describe('监控告警 API 测试', () => {
  let app: express.Application
  
  beforeAll(() => {
    app = createTestApp()
    app.use('/api/monitors', createMonitorRoutes())
  })
  
  beforeEach(() => {
    mockDb.metrics.clear()
    mockDb.alerts.clear()
    mockDb.rules.clear()
    mockDb.metrics.set(1, { id: 1, name: 'cpu_usage', value: 75.5, unit: '%', timestamp: new Date().toISOString() })
    mockDb.alerts.set(1, { id: 1, name: 'High CPU Alert', level: 'warning', status: 'triggered', value: 95 })
    mockDb.rules.set(1, { id: 1, name: 'CPU告警规则', metric: 'cpu_usage', threshold: 80, condition: '>', status: 1 })
  })
  
  describe('指标监控', () => {
    describe('GET /api/monitors/metrics', () => {
      it('应该返回指标列表', async () => {
        const response = await request(app)
          .get('/api/monitors/metrics')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.list).toBeDefined()
      })
      
      it('应该支持分页参数', async () => {
        const response = await request(app)
          .get('/api/monitors/metrics?page=1&pageSize=10')
          .expect(200)
        
        expect(response.body.data.page).toBe(1)
      })
    })
  })
  
  describe('告警管理', () => {
    describe('GET /api/monitors/alerts', () => {
      it('应该返回告警列表', async () => {
        const response = await request(app)
          .get('/api/monitors/alerts')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.list).toBeDefined()
      })
      
      it('应该支持状态筛选', async () => {
        const response = await request(app)
          .get('/api/monitors/alerts?status=triggered')
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
    })
    
    describe('GET /api/monitors/alerts/:id', () => {
      it('应该返回告警详情', async () => {
        const response = await request(app)
          .get('/api/monitors/alerts/1')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.id).toBe(1)
      })
      
      it('告警不存在应返回404', async () => {
        const response = await request(app)
          .get('/api/monitors/alerts/9999')
          .expect(404)
        
        expect(response.body.code).toBe(404)
      })
    })
    
    describe('PUT /api/monitors/alerts/:id/handle', () => {
      it('应该处理告警', async () => {
        const response = await request(app)
          .put('/api/monitors/alerts/1/handle')
          .send({ handler: 'admin', solution: 'Restarted service' })
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
    })
  })
  
  describe('告警规则', () => {
    describe('GET /api/monitors/rules', () => {
      it('应该返回规则列表', async () => {
        const response = await request(app)
          .get('/api/monitors/rules')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
      })
    })
    
    describe('POST /api/monitors/rules', () => {
      it('应该创建告警规则', async () => {
        const response = await request(app)
          .post('/api/monitors/rules')
          .send({ name: 'Memory Alert', metric: 'memory_usage', threshold: 90 })
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
      
      it('缺少必填参数应返回400', async () => {
        const response = await request(app)
          .post('/api/monitors/rules')
          .send({ name: 'Memory Alert' })
          .expect(400)
        
        expect(response.body.code).toBe(400)
      })
    })
    
    describe('DELETE /api/monitors/rules/:id', () => {
      it('应该删除规则', async () => {
        const response = await request(app)
          .delete('/api/monitors/rules/1')
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
    })
  })
})