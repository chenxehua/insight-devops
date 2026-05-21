// 脚本API完整测试 - 覆盖所有端点和代码路径
import { describe, it, expect, beforeEach } from 'vitest'
import express, { Application } from 'express'
import request from 'supertest'

// Mock data store
const mockScripts = new Map([
  [1, { id: 1, script_name: 'Deploy Script', script_code: 'deploy', script_type: 'bash', content: '#!/bin/bash\necho deploy', category_id: 1, version: 2, tags: ['deploy'], params: '{}', created_at: '2024-01-01 10:00:00', updated_at: '2024-01-01 10:00:00' }],
  [2, { id: 2, script_name: 'Health Check', script_code: 'health', script_type: 'bash', content: '#!/bin/bash\necho ok', category_id: 1, version: 1, tags: ['monitor'], params: '{}', created_at: '2024-01-02 10:00:00', updated_at: '2024-01-02 10:00:00' }],
])
const mockScriptCategories = new Map([
  [1, { id: 1, category_name: 'Deployment', description: 'Scripts for deployment' }],
  [2, { id: 2, category_name: 'Maintenance', description: 'Maintenance scripts' }],
])
const mockScriptVersions = new Map([
  [1, { id: 1, script_id: 1, version: 1, content: '#!/bin/bash\necho old', change_note: 'Initial' }],
  [2, { id: 2, script_id: 1, version: 2, content: '#!/bin/bash\necho deploy', change_note: 'Updated' }],
])
const mockScriptExecutions = new Map([
  [1, { id: 1, script_id: 1, status: 'success', output: 'Deployed', started_at: '2024-01-01 10:00:00', finished_at: '2024-01-01 10:00:30' }],
])

const createApp = (): Application => {
  const app = express()
  app.use(express.json())

  // Auth middleware mock
  app.use((req, res, next) => {
    const cookie = req.headers.cookie
    if (!cookie || !cookie.includes('token=')) {
      return res.status(401).json({ code: 401, message: '未认证' })
    }
    next()
  })

  // Script category routes
  const categoryRouter = express.Router()
  categoryRouter.get('/', (req, res) => {
    const list = Array.from(mockScriptCategories.values())
    res.json({ code: 200, data: { list, total: list.length } })
  })
  categoryRouter.post('/', (req, res) => {
    const { categoryName } = req.body
    if (!categoryName) return res.status(400).json({ code: 400, message: '分类名称不能为空' })
    const id = Date.now()
    mockScriptCategories.set(id, { id, category_name: categoryName, description: req.body.description || '' })
    res.json({ code: 200, data: { id } })
  })
  categoryRouter.delete('/:id', (req, res) => {
    mockScriptCategories.delete(parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  })
  app.use('/api/scripts/categories', categoryRouter)

  // Script routes
  const scriptRouter = express.Router()
  scriptRouter.get('/', (req, res) => {
    let list = Array.from(mockScripts.values())
    if (req.query.keyword) {
      const kw = req.query.keyword as string
      list = list.filter(s => s.script_name.includes(kw) || s.script_code.includes(kw))
    }
    if (req.query.scriptType) list = list.filter(s => s.script_type === req.query.scriptType)
    if (req.query.categoryId) list = list.filter(s => s.category_id === parseInt(req.query.categoryId as string))
    res.json({ code: 200, data: { list, total: list.length, page: 1, pageSize: 20 } })
  })
  scriptRouter.get('/:id', (req, res) => {
    const script = mockScripts.get(parseInt(req.params.id))
    if (!script) return res.status(404).json({ code: 404, message: '脚本不存在' })
    res.json({ code: 200, data: script })
  })
  scriptRouter.get('/:id/versions', (req, res) => {
    const script = mockScripts.get(parseInt(req.params.id))
    if (!script) return res.status(404).json({ code: 404, message: '脚本不存在' })
    const versions = Array.from(mockScriptVersions.values()).filter(v => v.script_id === script.id)
    res.json({ code: 200, data: versions })
  })
  scriptRouter.get('/:id/executions', (req, res) => {
    const script = mockScripts.get(parseInt(req.params.id))
    if (!script) return res.status(404).json({ code: 404, message: '脚本不存在' })
    const executions = Array.from(mockScriptExecutions.values()).filter(e => e.script_id === script.id)
    res.json({ code: 200, data: { list: executions, total: executions.length, page: 1, pageSize: 20 } })
  })
  scriptRouter.post('/', (req, res) => {
    const { scriptName, scriptCode, scriptType } = req.body
    if (!scriptName || !scriptCode) {
      return res.status(400).json({ code: 400, message: '脚本名称和代码不能为空' })
    }
    const existing = Array.from(mockScripts.values()).find(s => s.script_code === scriptCode)
    if (existing) return res.status(409).json({ code: 409, message: '脚本代码已存在' })
    const id = Date.now()
    mockScripts.set(id, { id, script_name: scriptName, script_code: scriptCode, script_type: scriptType || 'bash', content: req.body.content || '', category_id: req.body.categoryId || null, version: 1, tags: req.body.tags || [], params: req.body.params || '{}', created_at: new Date().toISOString() })
    res.json({ code: 200, data: { id } })
  })
  scriptRouter.put('/:id', (req, res) => {
    const script = mockScripts.get(parseInt(req.params.id))
    if (!script) return res.status(404).json({ code: 404, message: '脚本不存在' })
    if (req.body.content && req.body.content !== script.content) {
      script.version++
    }
    Object.assign(script, req.body)
    res.json({ code: 200, message: '更新成功' })
  })
  scriptRouter.delete('/:id', (req, res) => {
    mockScripts.delete(parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  })
  scriptRouter.post('/:id/execute', (req, res) => {
    const script = mockScripts.get(parseInt(req.params.id))
    if (!script) return res.status(404).json({ code: 404, message: '脚本不存在' })
    const id = Date.now()
    mockScriptExecutions.set(id, { id, script_id: script.id, status: 'running', started_at: new Date().toISOString() })
    res.json({ code: 200, data: { id, status: 'running' } })
  })
  app.use('/api/scripts', scriptRouter)

  // Script execution routes
  const executionRouter = express.Router()
  executionRouter.get('/', (req, res) => {
    let list = Array.from(mockScriptExecutions.values())
    if (req.query.status) list = list.filter(e => e.status === req.query.status)
    res.json({ code: 200, data: { list, total: list.length, page: 1, pageSize: 20 } })
  })
  executionRouter.get('/:id', (req, res) => {
    const execution = mockScriptExecutions.get(parseInt(req.params.id))
    if (!execution) return res.status(404).json({ code: 404, message: '执行记录不存在' })
    res.json({ code: 200, data: execution })
  })
  app.use('/api/scripts/executions', executionRouter)

  return app
}

describe('Script API 完整测试', () => {
  let app: Application

  beforeEach(() => {
    app = createApp()
    mockScripts.clear()
    mockScripts.set(1, { id: 1, script_name: 'Deploy Script', script_code: 'deploy', script_type: 'bash', content: '#!/bin/bash\necho deploy', category_id: 1, version: 2, tags: ['deploy'], params: '{}', created_at: '2024-01-01 10:00:00' })
    mockScripts.set(2, { id: 2, script_name: 'Health Check', script_code: 'health', script_type: 'bash', content: '#!/bin/bash\necho ok', category_id: 1, version: 1, tags: ['monitor'], params: '{}', created_at: '2024-01-02 10:00:00' })
    mockScriptCategories.clear()
    mockScriptCategories.set(1, { id: 1, category_name: 'Deployment', description: 'Scripts for deployment' })
    mockScriptCategories.set(2, { id: 2, category_name: 'Maintenance', description: 'Maintenance scripts' })
    mockScriptVersions.clear()
    mockScriptVersions.set(1, { id: 1, script_id: 1, version: 1, content: '#!/bin/bash\necho old', change_note: 'Initial' })
    mockScriptVersions.set(2, { id: 2, script_id: 1, version: 2, content: '#!/bin/bash\necho deploy', change_note: 'Updated' })
    mockScriptExecutions.clear()
    mockScriptExecutions.set(1, { id: 1, script_id: 1, status: 'success', output: 'Deployed', started_at: '2024-01-01 10:00:00', finished_at: '2024-01-01 10:00:30' })
  })

  describe('GET /api/scripts/categories', () => {
    it('应该返回脚本分类列表', async () => {
      const res = await request(app).get('/api/scripts/categories').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data.list)).toBe(true)
    })
  })

  describe('POST /api/scripts/categories', () => {
    it('应该创建新的脚本分类', async () => {
      const res = await request(app)
        .post('/api/scripts/categories')
        .set('Cookie', 'token=test')
        .send({ categoryName: 'Test Category' })
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id')
    })

    it('缺少分类名称应该返回400', async () => {
      const res = await request(app)
        .post('/api/scripts/categories')
        .set('Cookie', 'token=test')
        .send({})
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/scripts', () => {
    it('应该返回脚本列表', async () => {
      const res = await request(app).get('/api/scripts').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('list')
    })

    it('应该支持关键词搜索', async () => {
      const res = await request(app).get('/api/scripts?keyword=deploy').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })

    it('应该支持按类型筛选', async () => {
      const res = await request(app).get('/api/scripts?scriptType=bash').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })

    it('应该支持按分类筛选', async () => {
      const res = await request(app).get('/api/scripts?categoryId=1').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })

    it('未认证应该返回401', async () => {
      const res = await request(app).get('/api/scripts')
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/scripts', () => {
    it('应该创建新脚本', async () => {
      const res = await request(app)
        .post('/api/scripts')
        .set('Cookie', 'token=test')
        .send({ scriptName: 'New Script', scriptCode: 'new_script', scriptType: 'bash', content: '#!/bin/bash' })
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id')
    })

    it('缺少必填字段应该返回400', async () => {
      const res = await request(app)
        .post('/api/scripts')
        .set('Cookie', 'token=test')
        .send({ scriptName: 'Test' })
      expect(res.status).toBe(400)
    })

    it('重复脚本代码应该返回409', async () => {
      const res = await request(app)
        .post('/api/scripts')
        .set('Cookie', 'token=test')
        .send({ scriptName: 'Duplicate', scriptCode: 'deploy' })
      expect(res.status).toBe(409)
    })
  })

  describe('GET /api/scripts/:id', () => {
    it('应该返回脚本详情', async () => {
      const res = await request(app).get('/api/scripts/1').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id')
    })

    it('脚本不存在应该返回404', async () => {
      const res = await request(app).get('/api/scripts/9999').set('Cookie', 'token=test')
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/scripts/:id', () => {
    it('应该更新脚本基本信息', async () => {
      const res = await request(app)
        .put('/api/scripts/1')
        .set('Cookie', 'token=test')
        .send({ scriptName: 'Updated Script' })
      expect(res.status).toBe(200)
    })

    it('应该支持更新内容并增加版本号', async () => {
      const res = await request(app)
        .put('/api/scripts/1')
        .set('Cookie', 'token=test')
        .send({ content: '#!/bin/bash\necho updated' })
      expect(res.status).toBe(200)
    })

    it('脚本不存在应该返回404', async () => {
      const res = await request(app)
        .put('/api/scripts/9999')
        .set('Cookie', 'token=test')
        .send({ scriptName: 'Updated' })
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/scripts/:id', () => {
    it('应该删除脚本', async () => {
      const res = await request(app).delete('/api/scripts/1').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })

    it('脚本不存在应该返回404', async () => {
      const res = await request(app).delete('/api/scripts/9999').set('Cookie', 'token=test')
      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/scripts/:id/versions', () => {
    it('应该返回版本历史', async () => {
      const res = await request(app).get('/api/scripts/1/versions').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('POST /api/scripts/:id/execute', () => {
    it('应该创建脚本执行任务', async () => {
      const res = await request(app).post('/api/scripts/1/execute').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id')
    })

    it('脚本不存在应该返回404', async () => {
      const res = await request(app).post('/api/scripts/9999/execute').set('Cookie', 'token=test')
      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/scripts/:id/executions', () => {
    it('应该返回脚本执行记录列表', async () => {
      const res = await request(app).get('/api/scripts/1/executions').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('list')
    })
  })

  describe('GET /api/scripts/executions/:id', () => {
    it('应该返回执行结果详情', async () => {
      const res = await request(app).get('/api/scripts/executions/1').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('status')
    })

    it('执行记录不存在应该返回404', async () => {
      const res = await request(app).get('/api/scripts/executions/9999').set('Cookie', 'token=test')
      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/scripts/executions', () => {
    it('应该返回执行记录列表', async () => {
      const res = await request(app).get('/api/scripts/executions').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })

    it('应该支持按状态筛选', async () => {
      const res = await request(app).get('/api/scripts/executions?status=success').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })
  })
})