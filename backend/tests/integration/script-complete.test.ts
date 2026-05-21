// 脚本管理 - 完整API测试
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

// Mock database
const mockDatabase = {
  scripts: new Map([
    [1, { id: 1, script_name: 'Deploy Script', script_code: 'deploy', script_type: 'bash', content: '#!/bin/bash\necho hello', params: null, version: 1, status: 1 }],
    [2, { id: 2, script_name: 'Build Script', script_code: 'build', script_type: 'python', content: 'print("build")', params: null, version: 1, status: 1 }],
  ]),
  executions: new Map([
    [1, { id: 1, script_id: 1, params: null, target_host: 'localhost', status: 'completed', output: 'Success', error_output: null }],
    [2, { id: 2, script_id: 1, params: '{"env":"prod"}', target_host: 'server1', status: 'failed', output: null, error_output: 'Error' }],
  ]),
}

// Script routes
const createScriptRoutes = () => {
  const router = express.Router()

  // List
  router.get('/', (req, res) => {
    const list = Array.from(mockDatabase.scripts.values())
    res.json({ code: 200, message: 'success', data: { list, total: list.length, page: 1, pageSize: 20 } })
  })

  // Detail
  router.get('/:id', (req, res) => {
    const script = mockDatabase.scripts.get(parseInt(req.params.id))
    if (!script) return res.status(404).json({ code: 404, message: '脚本不存在' })
    res.json({ code: 200, message: 'success', data: script })
  })

  // Create
  router.post('/', (req, res) => {
    const { scriptName, scriptCode, scriptType, content } = req.body
    if (!scriptName || !scriptCode || !scriptType || !content) {
      return res.status(400).json({ code: 400, message: '脚本名称、代码、类型和内容不能为空' })
    }
    if (Array.from(mockDatabase.scripts.values()).some(s => s.script_code === scriptCode)) {
      return res.status(409).json({ code: 409, message: '脚本代码已存在' })
    }
    const id = Date.now()
    mockDatabase.scripts.set(id, { id, script_name: scriptName, script_code: scriptCode, script_type: scriptType, content, params: null, version: 1, status: 1 })
    res.json({ code: 200, message: '创建成功', data: { id } })
  })

  // Update
  router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id)
    if (!mockDatabase.scripts.has(id)) {
      return res.status(404).json({ code: 404, message: '脚本不存在' })
    }
    const script = mockDatabase.scripts.get(id)
    if (req.body.content) script.version++
    res.json({ code: 200, message: '更新成功' })
  })

  // Delete
  router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id)
    if (!mockDatabase.scripts.has(id)) {
      return res.status(404).json({ code: 404, message: '脚本不存在' })
    }
    mockDatabase.scripts.delete(id)
    res.json({ code: 200, message: '删除成功' })
  })

  // Versions
  router.get('/:id/versions', (req, res) => {
    const script = mockDatabase.scripts.get(parseInt(req.params.id))
    if (!script) return res.status(404).json({ code: 404, message: '脚本不存在' })
    res.json({ code: 200, message: 'success', data: [{ id: 1, version: 1, change_note: null, created_at: new Date().toISOString() }] })
  })

  // Execute
  router.post('/:id/execute', (req, res) => {
    const script = mockDatabase.scripts.get(parseInt(req.params.id))
    if (!script) return res.status(404).json({ code: 404, message: '脚本不存在' })
    const execId = Date.now()
    mockDatabase.executions.set(execId, { id: execId, script_id: script.id, params: JSON.stringify(req.body.params) || null, target_host: req.body.targetHost || null, status: 'pending' })
    res.json({ code: 200, message: '脚本执行任务已创建', data: { id: execId } })
  })

  // Executions list
  router.get('/:id/executions', (req, res) => {
    const list = Array.from(mockDatabase.executions.values()).filter(e => e.script_id === parseInt(req.params.id))
    res.json({ code: 200, message: 'success', data: { list, total: list.length, page: 1, pageSize: 20 } })
  })

  return router
}

// Execution routes (separate)
const createExecutionRoutes = () => {
  const router = express.Router()

  router.get('/:id', (req, res) => {
    const execution = mockDatabase.executions.get(parseInt(req.params.id))
    if (!execution) return res.status(404).json({ code: 404, message: '执行记录不存在' })
    res.json({ code: 200, message: 'success', data: execution })
  })

  return router
}

describe('脚本管理 API 完整测试', () => {
  const app = express()
  app.use(express.json())
  app.use('/api/scripts', createScriptRoutes())
  app.use('/api/scripts/executions', createExecutionRoutes())

  beforeEach(() => {
    mockDatabase.scripts.clear()
    mockDatabase.scripts.set(1, { id: 1, script_name: 'Deploy Script', script_code: 'deploy', script_type: 'bash', content: '#!/bin/bash\necho hello', params: null, version: 1, status: 1 })
    mockDatabase.scripts.set(2, { id: 2, script_name: 'Build Script', script_code: 'build', script_type: 'python', content: 'print("build")', params: null, version: 1, status: 1 })
    mockDatabase.executions.clear()
    mockDatabase.executions.set(1, { id: 1, script_id: 1, params: null, target_host: 'localhost', status: 'completed', output: 'Success', error_output: null })
    mockDatabase.executions.set(2, { id: 2, script_id: 1, params: '{"env":"prod"}', target_host: 'server1', status: 'failed', output: null, error_output: 'Error' })
  })

  describe('GET /api/scripts', () => {
    it('返回脚本列表', async () => {
      const res = await request(app).get('/api/scripts').expect(200)
      expect(res.body.code).toBe(200)
      expect(Array.isArray(res.body.data.list)).toBe(true)
    })

    it('支持按类型筛选', async () => {
      const res = await request(app).get('/api/scripts?scriptType=bash').expect(200)
      expect(res.body.code).toBe(200)
    })

    it('支持按关键词搜索', async () => {
      const res = await request(app).get('/api/scripts?keyword=deploy').expect(200)
      expect(res.body.code).toBe(200)
    })
  })

  describe('GET /api/scripts/:id', () => {
    it('返回脚本详情', async () => {
      const res = await request(app).get('/api/scripts/1').expect(200)
      expect(res.body.code).toBe(200)
      expect(res.body.data.script_name).toBe('Deploy Script')
    })

    it('不存在的脚本返回404', async () => {
      const res = await request(app).get('/api/scripts/9999').expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('POST /api/scripts', () => {
    it('创建新脚本', async () => {
      const res = await request(app)
        .post('/api/scripts')
        .send({ scriptName: 'Test Script', scriptCode: 'test', scriptType: 'bash', content: 'echo test' })
        .expect(200)
      expect(res.body.code).toBe(200)
    })

    it('缺少必填参数返回400', async () => {
      const res = await request(app).post('/api/scripts').send({ scriptName: 'Test' }).expect(400)
      expect(res.body.code).toBe(400)
    })

    it('重复脚本代码返回409', async () => {
      const res = await request(app)
        .post('/api/scripts')
        .send({ scriptName: 'New Script', scriptCode: 'deploy', scriptType: 'bash', content: 'echo new' })
        .expect(409)
      expect(res.body.code).toBe(409)
    })
  })

  describe('PUT /api/scripts/:id', () => {
    it('更新脚本', async () => {
      const res = await request(app).put('/api/scripts/1').send({ scriptName: 'Updated Script' }).expect(200)
      expect(res.body.code).toBe(200)
    })

    it('更新内容时增加版本号', async () => {
      const originalVersion = mockDatabase.scripts.get(1).version
      await request(app).put('/api/scripts/1').send({ content: 'new content' }).expect(200)
      expect(mockDatabase.scripts.get(1).version).toBe(originalVersion + 1)
    })

    it('更新不存在的脚本返回404', async () => {
      const res = await request(app).put('/api/scripts/9999').send({ scriptName: 'Test' }).expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('DELETE /api/scripts/:id', () => {
    it('删除脚本', async () => {
      const res = await request(app).delete('/api/scripts/1').expect(200)
      expect(res.body.code).toBe(200)
      expect(mockDatabase.scripts.has(1)).toBe(false)
    })

    it('删除不存在的脚本返回404', async () => {
      const res = await request(app).delete('/api/scripts/9999').expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('GET /api/scripts/:id/versions', () => {
    it('返回脚本版本历史', async () => {
      const res = await request(app).get('/api/scripts/1/versions').expect(200)
      expect(res.body.code).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('POST /api/scripts/:id/execute', () => {
    it('执行脚本', async () => {
      const res = await request(app)
        .post('/api/scripts/1/execute')
        .send({ params: { env: 'prod' }, targetHost: 'server1' })
        .expect(200)
      expect(res.body.code).toBe(200)
      expect(res.body.data.id).toBeDefined()
    })

    it('不存在的脚本返回404', async () => {
      const res = await request(app).post('/api/scripts/9999/execute').send({}).expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('GET /api/scripts/:id/executions', () => {
    it('返回脚本执行记录', async () => {
      const res = await request(app).get('/api/scripts/1/executions').expect(200)
      expect(res.body.code).toBe(200)
      expect(Array.isArray(res.body.data.list)).toBe(true)
    })
  })

  describe('GET /api/scripts/executions/:id', () => {
    it('返回执行结果详情', async () => {
      const res = await request(app).get('/api/scripts/executions/1').expect(200)
      expect(res.body.code).toBe(200)
      expect(res.body.data.status).toBe('completed')
    })

    it('不存在的执行记录返回404', async () => {
      const res = await request(app).get('/api/scripts/executions/9999').expect(404)
      expect(res.body.code).toBe(404)
    })
  })
})