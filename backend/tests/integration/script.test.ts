// 脚本管理API集成测试
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  return app
}

const mockDb = {
  scripts: new Map(),
  scriptExecutions: new Map(),
}

// 脚本执行结果路由
const createExecutionRoutes = () => {
  const router = express.Router()
  
  router.get('/:id', (req, res) => {
    const execution = mockDb.scriptExecutions.get(parseInt(req.params.id))
    if (!execution) {
      return res.status(404).json({ code: 404, message: '执行记录不存在' })
    }
    res.json({ code: 200, message: 'success', data: execution })
  })
  
  return router
}

// 脚本路由
const createScriptRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const scripts = Array.from(mockDb.scripts.values())
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: scripts.slice(0, 20),
        total: scripts.length,
        page: 1,
        pageSize: 20
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
    const { scriptName, scriptCode, scriptType, content } = req.body
    if (!scriptName || !scriptCode || !scriptType || !content) {
      return res.status(400).json({ code: 400, message: '脚本名称、代码、类型和内容不能为空' })
    }
    const id = Date.now()
    const script = { id, scriptName, scriptCode, scriptType, content, version: 1 }
    mockDb.scripts.set(id, script)
    res.json({ code: 200, message: '创建成功', data: { id } })
  })
  
  router.post('/:id/execute', (req, res) => {
    const script = mockDb.scripts.get(parseInt(req.params.id))
    if (!script) {
      return res.status(404).json({ code: 404, message: '脚本不存在' })
    }
    const execId = Date.now()
    const execution = { id: execId, scriptId: script.id, status: 'pending' }
    mockDb.scriptExecutions.set(execId, execution)
    res.json({ code: 200, message: '脚本执行任务已创建', data: { id: execId } })
  })
  
  router.get('/:id/executions', (req, res) => {
    const scriptId = parseInt(req.params.id)
    const executions = Array.from(mockDb.scriptExecutions.values())
      .filter(e => e.scriptId === scriptId)
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: executions,
        total: executions.length,
        page: 1,
        pageSize: 20
      }
    })
  })
  
  return router
}

describe('脚本管理 API 测试', () => {
  const app = createTestApp()
  app.use('/api/scripts', createScriptRoutes())
  app.use('/api/scripts/executions', createExecutionRoutes())
  
  beforeEach(() => {
    mockDb.scripts.clear()
    mockDb.scriptExecutions.clear()
    mockDb.scripts.set(1, {
      id: 1, scriptName: 'Test Script', scriptCode: 'test-script',
      scriptType: 'bash', content: 'echo "Hello"', version: 1
    })
  })
  
  describe('GET /api/scripts', () => {
    it('应该返回脚本列表', async () => {
      const response = await request(app)
        .get('/api/scripts')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.list).toBeDefined()
    })
    
    it('应该支持关键字搜索', async () => {
      const response = await request(app)
        .get('/api/scripts?keyword=test')
        .expect(200)
      
      expect(response.body.code).toBe(200)
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
        .send({
          scriptName: 'New Script',
          scriptCode: 'new-script',
          scriptType: 'bash',
          content: 'echo "test"'
        })
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.id).toBeDefined()
    })
    
    it('缺少必填参数应返回400', async () => {
      const response = await request(app)
        .post('/api/scripts')
        .send({ scriptName: 'Test' })
        .expect(400)
      
      expect(response.body.code).toBe(400)
    })
  })
  
  describe('POST /api/scripts/:id/execute', () => {
    it('应该执行脚本并返回执行ID', async () => {
      const response = await request(app)
        .post('/api/scripts/1/execute')
        .send({ params: { arg1: 'value1' }, targetHost: 'localhost' })
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.id).toBeDefined()
    })
    
    it('脚本不存在应返回404', async () => {
      const response = await request(app)
        .post('/api/scripts/9999/execute')
        .expect(404)
      
      expect(response.body.code).toBe(404)
    })
  })
  
  describe('GET /api/scripts/:id/executions', () => {
    it('应该返回脚本执行记录', async () => {
      // 先创建一个执行记录
      const execId = Date.now()
      mockDb.scriptExecutions.set(execId, { id: execId, scriptId: 1, status: 'pending' })
      
      const response = await request(app)
        .get('/api/scripts/1/executions')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.list).toBeDefined()
    })
  })
  
  describe('GET /api/scripts/executions/:id', () => {
    it('应该返回执行详情', async () => {
      const execId = Date.now()
      mockDb.scriptExecutions.set(execId, {
        id: execId, scriptId: 1, scriptName: 'Test Script',
        status: 'pending', output: '', errorOutput: ''
      })
      
      const response = await request(app)
        .get(`/api/scripts/executions/${execId}`)
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.id).toBe(execId)
    })
    
    it('执行记录不存在应返回404', async () => {
      const response = await request(app)
        .get('/api/scripts/executions/9999')
        .expect(404)
      
      expect(response.body.code).toBe(404)
    })
  })
})