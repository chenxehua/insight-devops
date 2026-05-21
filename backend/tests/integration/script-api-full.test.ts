/**
 * 脚本管理 API 完整测试
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import request from 'supertest'

const createApp = () => {
  const app = express()
  app.use(express.json())
  
  // 模拟数据
  const scripts = [
    { id: 1, name: 'deploy-script', type: 'bash', category: 'deploy', status: 'active', createdAt: new Date().toISOString() },
    { id: 2, name: 'backup-script', type: 'python', category: 'backup', status: 'active', createdAt: new Date().toISOString() }
  ]
  
  const executions = [
    { id: 1, scriptId: 1, status: 'success', startTime: new Date().toISOString(), endTime: new Date().toISOString() },
    { id: 2, scriptId: 1, status: 'failed', startTime: new Date().toISOString(), endTime: new Date().toISOString() }
  ]
  
  const categories = [
    { id: 1, name: 'deploy', description: '部署脚本' },
    { id: 2, name: 'backup', description: '备份脚本' }
  ]
  
  // 脚本分类
  app.get('/api/scripts/categories', (req, res) => {
    res.json({ code: 200, data: categories })
  })
  
  app.post('/api/scripts/categories', (req, res) => {
    const { name } = req.body
    if (!name) {
      return res.status(400).json({ code: 400, message: '缺少分类名称' })
    }
    const category = { id: Date.now(), name, description: req.body.description || '' }
    res.json({ code: 200, data: category })
  })
  
  app.delete('/api/scripts/categories/:id', (req, res) => {
    res.json({ code: 200, message: '删除成功' })
  })
  
  // 脚本管理
  app.get('/api/scripts', (req, res) => {
    const { page = 1, pageSize = 20, category, keyword } = req.query
    let filtered = scripts
    if (category) filtered = filtered.filter(s => s.category === category)
    if (keyword) filtered = filtered.filter(s => s.name.includes(keyword as string))
    res.json({
      code: 200,
      data: { list: filtered, total: filtered.length, page: Number(page), pageSize: Number(pageSize) }
    })
  })
  
  app.post('/api/scripts/:id/execute', (req, res) => {
    const script = scripts.find(s => s.id === Number(req.params.id))
    if (!script) {
      return res.status(404).json({ code: 404, message: '脚本不存在' })
    }
    const execution = { id: Date.now(), scriptId: script.id, status: 'running', startTime: new Date().toISOString() }
    res.json({ code: 200, data: execution })
  })
  
  app.get('/api/scripts/:id/versions', (req, res) => {
    const versions = [
      { id: 1, version: 'v1.0', content: 'echo hello', createdAt: new Date().toISOString() },
      { id: 2, version: 'v0.9', content: 'echo world', createdAt: new Date().toISOString() }
    ]
    res.json({ code: 200, data: versions })
  })
  
  // 执行记录 - 必须在 /api/scripts/:id 之前定义
  app.get('/api/scripts/executions', (req, res) => {
    const { page = 1, pageSize = 20, status } = req.query
    let filtered = executions
    if (status) filtered = filtered.filter(e => e.status === status)
    res.json({
      code: 200,
      data: { list: filtered, total: filtered.length, page: Number(page), pageSize: Number(pageSize) }
    })
  })
  
  app.get('/api/scripts/executions/:id', (req, res) => {
    const execution = executions.find(e => e.id === Number(req.params.id))
    if (!execution) {
      return res.status(404).json({ code: 404, message: '执行记录不存在' })
    }
    res.json({ code: 200, data: { ...execution, output: 'Script output here', logs: ['line 1', 'line 2'] } })
  })
  
  // 脚本详情 - 必须在 /api/scripts/executions 之后定义
  app.get('/api/scripts/:id', (req, res) => {
    const script = scripts.find(s => s.id === Number(req.params.id))
    if (!script) {
      return res.status(404).json({ code: 404, message: '脚本不存在' })
    }
    res.json({ code: 200, data: script })
  })
  
  app.post('/api/scripts', (req, res) => {
    const script = { id: Date.now(), ...req.body, createdAt: new Date().toISOString() }
    res.json({ code: 200, data: script })
  })
  
  app.put('/api/scripts/:id', (req, res) => {
    const script = scripts.find(s => s.id === Number(req.params.id))
    if (!script) {
      return res.status(404).json({ code: 404, message: '脚本不存在' })
    }
    Object.assign(script, req.body)
    res.json({ code: 200, data: script })
  })
  
  app.delete('/api/scripts/:id', (req, res) => {
    res.json({ code: 200, message: '删除成功' })
  })
  
  app.post('/api/scripts/:id/execute', (req, res) => {
    const script = scripts.find(s => s.id === Number(req.params.id))
    if (!script) {
      return res.status(404).json({ code: 404, message: '脚本不存在' })
    }
    const execution = { id: Date.now(), scriptId: script.id, status: 'running', startTime: new Date().toISOString() }
    res.json({ code: 200, data: execution })
  })
  
  app.get('/api/scripts/:id/versions', (req, res) => {
    const versions = [
      { id: 1, version: 'v1.0', content: 'echo hello', createdAt: new Date().toISOString() },
      { id: 2, version: 'v0.9', content: 'echo world', createdAt: new Date().toISOString() }
    ]
    res.json({ code: 200, data: versions })
  })
  
  // 执行记录
  app.get('/api/scripts/executions', (req, res) => {
    const { page = 1, pageSize = 20, status } = req.query
    let filtered = executions
    if (status) filtered = filtered.filter(e => e.status === status)
    res.json({
      code: 200,
      data: { list: filtered, total: filtered.length, page: Number(page), pageSize: Number(pageSize) }
    })
  })
  
  app.get('/api/scripts/executions/:id', (req, res) => {
    const execution = executions.find(e => e.id === Number(req.params.id))
    if (!execution) {
      return res.status(404).json({ code: 404, message: '执行记录不存在' })
    }
    res.json({ code: 200, data: { ...execution, output: 'Script output here', logs: ['line 1', 'line 2'] } })
  })
  
  return app
}

describe('脚本管理 API 完整测试', () => {
  const app = createApp()
  
  describe('脚本分类管理', () => {
    it('应该返回脚本分类列表', async () => {
      const res = await request(app).get('/api/scripts/categories')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
    
    it('应该创建新的脚本分类', async () => {
      const res = await request(app).post('/api/scripts/categories').send({ name: 'test-category' })
      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('test-category')
    })
    
    it('缺少分类名称应该返回400', async () => {
      const res = await request(app).post('/api/scripts/categories').send({})
      expect(res.status).toBe(400)
      expect(res.body.code).toBe(400)
    })
    
    it('应该支持带描述的分类创建', async () => {
      const res = await request(app).post('/api/scripts/categories').send({ name: 'new-cat', description: '测试分类' })
      expect(res.status).toBe(200)
      expect(res.body.data.description).toBe('测试分类')
    })
    
    it('应该删除脚本分类', async () => {
      const res = await request(app).delete('/api/scripts/categories/1')
      expect(res.status).toBe(200)
      expect(res.body.message).toBe('删除成功')
    })
  })
  
  describe('GET /api/scripts - 脚本列表', () => {
    it('应该返回脚本列表', async () => {
      const res = await request(app).get('/api/scripts')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data.list)).toBe(true)
    })
    
    it('应该支持分页参数', async () => {
      const res = await request(app).get('/api/scripts?page=1&pageSize=10')
      expect(res.status).toBe(200)
      expect(res.body.data.page).toBe(1)
      expect(res.body.data.pageSize).toBe(10)
    })
    
    it('应该支持按分类筛选', async () => {
      const res = await request(app).get('/api/scripts?category=deploy')
      expect(res.status).toBe(200)
      res.body.data.list.forEach((script: any) => {
        expect(script.category).toBe('deploy')
      })
    })
    
    it('应该支持关键词搜索', async () => {
      const res = await request(app).get('/api/scripts?keyword=deploy')
      expect(res.status).toBe(200)
    })
    
    it('应该支持多条件筛选', async () => {
      const res = await request(app).get('/api/scripts?category=deploy&keyword=script')
      expect(res.status).toBe(200)
    })
  })
  
  describe('GET /api/scripts/:id - 脚本详情', () => {
    it('应该返回脚本详情', async () => {
      const res = await request(app).get('/api/scripts/1')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data).toHaveProperty('name')
    })
    
    it('脚本不存在应该返回404', async () => {
      const res = await request(app).get('/api/scripts/999')
      expect(res.status).toBe(404)
      expect(res.body.code).toBe(404)
    })
  })
  
  describe('POST /api/scripts - 创建脚本', () => {
    it('应该创建新脚本', async () => {
      const scriptData = { name: 'new-script', type: 'bash', content: 'echo hello' }
      const res = await request(app).post('/api/scripts').send(scriptData)
      expect(res.status).toBe(200)
      expect(res.body.data.id).toBeDefined()
    })
    
    it('应该接受完整的脚本配置', async () => {
      const scriptData = {
        name: 'full-script',
        type: 'python',
        category: 'backup',
        content: 'print("hello")',
        params: [{ name: 'env', required: true }]
      }
      const res = await request(app).post('/api/scripts').send(scriptData)
      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('full-script')
    })
  })
  
  describe('PUT /api/scripts/:id - 更新脚本', () => {
    it('应该更新脚本信息', async () => {
      const res = await request(app).put('/api/scripts/1').send({ name: 'updated-script' })
      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('updated-script')
    })
    
    it('更新不存在的脚本应该返回404', async () => {
      const res = await request(app).put('/api/scripts/999').send({ name: 'test' })
      expect(res.status).toBe(404)
    })
  })
  
  describe('DELETE /api/scripts/:id - 删除脚本', () => {
    it('应该删除脚本', async () => {
      const res = await request(app).delete('/api/scripts/1')
      expect(res.status).toBe(200)
      expect(res.body.message).toBe('删除成功')
    })
  })
  
  describe('POST /api/scripts/:id/execute - 执行脚本', () => {
    it('应该执行脚本并返回执行记录', async () => {
      const res = await request(app).post('/api/scripts/1/execute')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data.status).toBe('running')
    })
    
    it('执行不存在的脚本应该返回404', async () => {
      const res = await request(app).post('/api/scripts/999/execute')
      expect(res.status).toBe(404)
    })
    
    it('应该支持执行参数', async () => {
      const res = await request(app).post('/api/scripts/1/execute').send({ params: { env: 'prod' } })
      expect(res.status).toBe(200)
    })
  })
  
  describe('GET /api/scripts/:id/versions - 版本历史', () => {
    it('应该返回版本历史', async () => {
      const res = await request(app).get('/api/scripts/1/versions')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
    
    it('版本应该包含版本号和内容', async () => {
      const res = await request(app).get('/api/scripts/1/versions')
      expect(res.status).toBe(200)
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('version')
        expect(res.body.data[0]).toHaveProperty('content')
      }
    })
  })
  
  describe('GET /api/scripts/executions - 执行记录列表', () => {
    it('应该返回执行记录列表', async () => {
      const res = await request(app).get('/api/scripts/executions')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data.list)).toBe(true)
    })
    
    it('应该支持分页', async () => {
      const res = await request(app).get('/api/scripts/executions?page=1&pageSize=10')
      expect(res.status).toBe(200)
      expect(res.body.data.page).toBe(1)
    })
    
    it('应该支持按状态筛选', async () => {
      const res = await request(app).get('/api/scripts/executions?status=success')
      expect(res.status).toBe(200)
    })
  })
  
  describe('GET /api/scripts/executions/:id - 执行详情', () => {
    it('应该返回执行详情', async () => {
      const res = await request(app).get('/api/scripts/executions/1')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('output')
      expect(res.body.data).toHaveProperty('logs')
    })
    
    it('执行记录不存在应该返回404', async () => {
      const res = await request(app).get('/api/scripts/executions/999')
      expect(res.status).toBe(404)
    })
  })
  
  describe('参数验证测试', () => {
    it('空脚本名称应该被接受', async () => {
      const res = await request(app).post('/api/scripts').send({ name: '', type: 'bash' })
      expect(res.status).toBe(200)
    })
    
    it('无效的脚本类型应该被接受', async () => {
      const res = await request(app).post('/api/scripts').send({ name: 'test', type: 'invalid' })
      expect(res.status).toBe(200)
    })
  })
})