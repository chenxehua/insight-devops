// 脚本管理API集成测试
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
  scripts: new Map(),
  executions: new Map(),
}

// 脚本分类路由模拟
const createScriptCategoryRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    res.json({
      code: 200,
      message: 'success',
      data: [
        { id: 1, name: '部署脚本', description: '用于应用部署', sort: 1 },
        { id: 2, name: '运维脚本', description: '用于日常运维', sort: 2 },
      ]
    })
  })
  
  router.post('/', (req, res) => {
    const { name, description, sort } = req.body
    if (!name) {
      return res.status(400).json({ code: 400, message: '分类名称不能为空' })
    }
    res.json({ code: 200, message: '创建成功', data: { id: Date.now() } })
  })
  
  router.put('/:id', (req, res) => {
    res.json({ code: 200, message: '更新成功' })
  })
  
  router.delete('/:id', (req, res) => {
    res.json({ code: 200, message: '删除成功' })
  })
  
  return router
}

// 脚本路由模拟
const createScriptRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const scripts = Array.from(mockDb.scripts.values())
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: scripts.slice((page - 1) * pageSize, page * pageSize),
        total: scripts.length,
        page,
        pageSize,
        totalPages: Math.ceil(scripts.length / pageSize)
      }
    })
  })
  
  router.get('/:id', (req, res) => {
    const script = mockDb.scripts.get(parseInt(req.params.id))
    if (!script) {
      return res.status(404).json({ code: 404, message: '脚本不存在' })
    }
    res.json({ code: 200, message: 'success', data: script })
  })
  
  router.post('/', (req, res) => {
    const { name, scriptType, content, categoryId } = req.body
    if (!name || !scriptType) {
      return res.status(400).json({ code: 400, message: '脚本名称和类型不能为空' })
    }
    const id = Date.now()
    const script = { id, name, scriptType, categoryId, status: 1 }
    mockDb.scripts.set(id, script)
    res.json({ code: 200, message: '创建成功', data: { id } })
  })
  
  router.put('/:id', (req, res) => {
    const script = mockDb.scripts.get(parseInt(req.params.id))
    if (!script) {
      return res.status(404).json({ code: 404, message: '脚本不存在' })
    }
    res.json({ code: 200, message: '更新成功' })
  })
  
  router.delete('/:id', (req, res) => {
    if (!mockDb.scripts.has(parseInt(req.params.id))) {
      return res.status(404).json({ code: 404, message: '脚本不存在' })
    }
    mockDb.scripts.delete(parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  })
  
  // 执行脚本
  router.post('/:id/execute', (req, res) => {
    const script = mockDb.scripts.get(parseInt(req.params.id))
    if (!script) {
      return res.status(404).json({ code: 404, message: '脚本不存在' })
    }
    const executionId = Date.now()
    res.json({
      code: 200,
      message: '脚本执行已启动',
      data: { executionId }
    })
  })
  
  // 版本历史
  router.get('/:id/versions', (req, res) => {
    res.json({
      code: 200,
      message: 'success',
      data: [
        { id: 1, version: 'v1.0.0', content: 'Initial version', createdAt: new Date().toISOString() }
      ]
    })
  })
  
  return router
}

// 执行记录路由模拟
const createExecutionRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const executions = Array.from(mockDb.executions.values())
    res.json({
      code: 200,
      message: 'success',
      data: { list: executions, total: executions.length }
    })
  })
  
  router.get('/:id', (req, res) => {
    const execution = mockDb.executions.get(parseInt(req.params.id))
    if (!execution) {
      return res.status(404).json({ code: 404, message: '执行记录不存在' })
    }
    res.json({ code: 200, message: 'success', data: execution })
  })
  
  return router
}

describe('脚本管理 API 测试', () => {
  let app: express.Application
  
  beforeAll(() => {
    app = createTestApp()
    app.use('/api/scripts/categories', createScriptCategoryRoutes())
    app.use('/api/scripts/executions', createExecutionRoutes())
    app.use('/api/scripts', createScriptRoutes())
  })
  
  beforeEach(() => {
    mockDb.scripts.clear()
    mockDb.executions.clear()
    mockDb.scripts.set(1, {
      id: 1, name: 'Deploy Script', scriptType: 'shell', content: 'echo hello', status: 1
    })
  })
  
  describe('脚本分类', () => {
    describe('GET /api/scripts/categories', () => {
      it('应该返回脚本分类列表', async () => {
        const response = await request(app)
          .get('/api/scripts/categories')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
      })
    })
    
    describe('POST /api/scripts/categories', () => {
      it('应该创建脚本分类', async () => {
        const response = await request(app)
          .post('/api/scripts/categories')
          .send({ name: 'Test Category', description: 'Test' })
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
      
      it('缺少名称应返回400', async () => {
        const response = await request(app)
          .post('/api/scripts/categories')
          .send({})
          .expect(400)
        
        expect(response.body.code).toBe(400)
      })
    })
  })
  
  describe('脚本管理', () => {
    describe('GET /api/scripts', () => {
      it('应该返回脚本列表', async () => {
        const response = await request(app)
          .get('/api/scripts')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.list).toBeDefined()
      })
      
      it('应该支持分页参数', async () => {
        const response = await request(app)
          .get('/api/scripts?page=1&pageSize=10')
          .expect(200)
        
        expect(response.body.data.page).toBe(1)
        expect(response.body.data.pageSize).toBe(10)
      })
    })
    
    describe('GET /api/scripts/:id', () => {
      it('应该返回脚本详情', async () => {
        const response = await request(app)
          .get('/api/scripts/1')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.id).toBe(1)
      })
      
      it('脚本不存在应返回404', async () => {
        const response = await request(app)
          .get('/api/scripts/9999')
          .expect(404)
        
        expect(response.body.code).toBe(404)
      })
    })
    
    describe('POST /api/scripts', () => {
      it('应该创建新脚本', async () => {
        const response = await request(app)
          .post('/api/scripts')
          .send({ name: 'New Script', scriptType: 'python' })
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
      
      it('缺少必填参数应返回400', async () => {
        const response = await request(app)
          .post('/api/scripts')
          .send({ name: 'New Script' })
          .expect(400)
        
        expect(response.body.code).toBe(400)
      })
    })
    
    describe('PUT /api/scripts/:id', () => {
      it('应该更新脚本', async () => {
        const response = await request(app)
          .put('/api/scripts/1')
          .send({ name: 'Updated Script' })
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
    })
    
    describe('DELETE /api/scripts/:id', () => {
      it('应该删除脚本', async () => {
        const response = await request(app)
          .delete('/api/scripts/1')
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
    })
    
    describe('POST /api/scripts/:id/execute', () => {
      it('应该执行脚本', async () => {
        const response = await request(app)
          .post('/api/scripts/1/execute')
          .send({ params: { env: 'prod' } })
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.executionId).toBeDefined()
      })
      
      it('脚本不存在应返回404', async () => {
        const response = await request(app)
          .post('/api/scripts/9999/execute')
          .expect(404)
        
        expect(response.body.code).toBe(404)
      })
    })
    
    describe('GET /api/scripts/:id/versions', () => {
      it('应该返回版本历史', async () => {
        const response = await request(app)
          .get('/api/scripts/1/versions')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
      })
    })
  })
  
  describe('执行记录', () => {
    describe('GET /api/scripts/executions', () => {
      it('应该返回执行记录列表', async () => {
        const response = await request(app)
          .get('/api/scripts/executions')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.list).toBeDefined()
      })
    })
    
    describe('GET /api/scripts/executions/:id', () => {
      beforeEach(() => {
        mockDb.executions.set(1, {
          id: 1, scriptId: 1, status: 'running', result: null, startedAt: new Date().toISOString()
        })
      })
      
      it('应该返回执行详情', async () => {
        const response = await request(app)
          .get('/api/scripts/executions/1')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.id).toBe(1)
      })
      
      it('执行记录不存在应返回404', async () => {
        const response = await request(app)
          .get('/api/scripts/executions/9999')
          .expect(404)
        
        expect(response.body.code).toBe(404)
      })
    })
  })
})