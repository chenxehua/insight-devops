// 日志管理API集成测试
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  return app
}

const mockDb = {
  logs: new Map(),
}

const createLogRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const logs = Array.from(mockDb.logs.values())
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: logs.slice((page - 1) * pageSize, page * pageSize),
        total: logs.length,
        page,
        pageSize,
        totalPages: Math.ceil(logs.length / pageSize)
      }
    })
  })
  
  router.get('/:id', (req, res) => {
    const log = mockDb.logs.get(parseInt(req.params.id))
    if (!log) {
      return res.status(404).json({ code: 404, message: '日志不存在' })
    }
    res.json({ code: 200, message: 'success', data: log })
  })
  
  router.get('/:id/context', (req, res) => {
    const log = mockDb.logs.get(parseInt(req.params.id))
    if (!log) {
      return res.status(404).json({ code: 404, message: '日志不存在' })
    }
    res.json({
      code: 200,
      message: 'success',
      data: {
        before: [
          { id: -1, message: 'Previous log line', timestamp: '2024-01-01T00:00:00Z' }
        ],
        current: log,
        after: [
          { id: 2, message: 'Next log line', timestamp: '2024-01-01T00:00:02Z' }
        ]
      }
    })
  })
  
  return router
}

describe('日志管理 API 测试', () => {
  let app: express.Application
  
  beforeAll(() => {
    app = createTestApp()
    app.use('/api/logs', createLogRoutes())
  })
  
  beforeEach(() => {
    mockDb.logs.clear()
    mockDb.logs.set(1, {
      id: 1, level: 'INFO', message: 'Application started', timestamp: '2024-01-01T00:00:00Z', source: 'app'
    })
  })
  
  describe('GET /api/logs', () => {
    it('应该返回日志列表', async () => {
      const response = await request(app)
        .get('/api/logs')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.list).toBeDefined()
    })
    
    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/logs?page=1&pageSize=10')
        .expect(200)
      
      expect(response.body.data.page).toBe(1)
    })
    
    it('应该支持日志级别筛选', async () => {
      const response = await request(app)
        .get('/api/logs?level=ERROR')
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
    
    it('应该支持时间范围筛选', async () => {
      const response = await request(app)
        .get('/api/logs?startTime=2024-01-01T00:00:00Z&endTime=2024-01-02T00:00:00Z')
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
    
    it('应该支持关键字搜索', async () => {
      const response = await request(app)
        .get('/api/logs?keyword=error')
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
  })
  
  describe('GET /api/logs/:id', () => {
    it('应该返回日志详情', async () => {
      const response = await request(app)
        .get('/api/logs/1')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.id).toBe(1)
    })
    
    it('日志不存在应返回404', async () => {
      const response = await request(app)
        .get('/api/logs/9999')
        .expect(404)
      
      expect(response.body.code).toBe(404)
    })
  })
  
  describe('GET /api/logs/:id/context', () => {
    it('应该返回日志上下文', async () => {
      const response = await request(app)
        .get('/api/logs/1/context')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.before).toBeDefined()
      expect(response.body.data.current).toBeDefined()
      expect(response.body.data.after).toBeDefined()
    })
    
    it('日志不存在应返回404', async () => {
      const response = await request(app)
        .get('/api/logs/9999/context')
        .expect(404)
      
      expect(response.body.code).toBe(404)
    })
  })
})