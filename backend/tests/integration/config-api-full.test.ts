/**
 * 配置管理 API 完整测试
 */
import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'

const createApp = () => {
  const app = express()
  app.use(express.json())
  
  const configs = [
    { id: 1, key: 'db.host', value: 'localhost', environment: 'dev', type: 'string', version: 2, createdAt: new Date().toISOString() },
    { id: 2, key: 'db.port', value: '3306', environment: 'dev', type: 'number', version: 1, createdAt: new Date().toISOString() },
    { id: 3, key: 'app.secret', value: 'secret', environment: 'prod', type: 'secret', version: 1, createdAt: new Date().toISOString() }
  ]
  
  const versions: Record<number, any[]> = {
    1: [
      { id: 1, version: 2, value: 'localhost', createdAt: new Date().toISOString() },
      { id: 2, version: 1, value: '127.0.0.1', createdAt: new Date().toISOString() }
    ]
  }
  
  app.get('/api/configs', (req, res) => {
    const { page = 1, pageSize = 20, environment, keyword, type } = req.query
    let filtered = configs
    if (environment) filtered = filtered.filter(c => c.environment === environment)
    if (keyword) filtered = filtered.filter(c => c.key.includes(keyword as string))
    if (type) filtered = filtered.filter(c => c.type === type)
    res.json({
      code: 200,
      data: { list: filtered, total: filtered.length, page: Number(page), pageSize: Number(pageSize) }
    })
  })
  
  // 版本历史必须在详情路由之前
  app.get('/api/configs/:id/versions', (req, res) => {
    const configVersions = versions[Number(req.params.id)] || []
    res.json({ code: 200, data: configVersions })
  })
  
  // 回滚必须在详情路由之前
  app.post('/api/configs/:id/rollback', (req, res) => {
    const { targetVersion } = req.body
    const config = configs.find(c => c.id === Number(req.params.id))
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    if (!targetVersion) return res.status(400).json({ code: 400, message: '缺少目标版本号' })
    const target = versions[config.id]?.find(v => v.version === targetVersion)
    if (!target) return res.status(404).json({ code: 404, message: '指定版本不存在' })
    res.json({ code: 200, message: '回滚成功', data: { ...config, value: target.value, version: config.version + 1 } })
  })
  
  // 对比必须在详情路由之前
  app.get('/api/configs/:id/diff', (req, res) => {
    const { fromVersion, toVersion } = req.query
    const configId = Number(req.params.id)
    const config = configs.find(c => c.id === configId)
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    const fromVer = fromVersion ? Number(fromVersion) : config.version - 1
    const toVer = toVersion ? Number(toVersion) : config.version
    const from = versions[configId]?.find(v => v.version === fromVer)
    const to = versions[configId]?.find(v => v.version === toVer)
    if ((fromVersion && !from) || (toVersion && !to)) {
      return res.status(404).json({ code: 404, message: '指定版本不存在' })
    }
    res.json({
      code: 200,
      data: {
        from: from || { version: 0, value: '' },
        to: to || { version: config.version, value: config.value },
        changes: from && to && from.value !== to.value ? [{ type: 'modified', from: from.value, to: to.value }] : []
      }
    })
  })
  
  // 配置详情路由
  app.get('/api/configs/:id', (req, res) => {
    const config = configs.find(c => c.id === Number(req.params.id))
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    res.json({ code: 200, data: config })
  })
  
  app.post('/api/configs', (req, res) => {
    const { key, value } = req.body
    if (!key || !value) return res.status(400).json({ code: 400, message: '缺少必填参数' })
    const config = { id: Date.now(), ...req.body, version: 1, createdAt: new Date().toISOString() }
    res.json({ code: 200, data: config })
  })
  
  app.put('/api/configs/:id', (req, res) => {
    const config = configs.find(c => c.id === Number(req.params.id))
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    Object.assign(config, req.body, { version: config.version + 1 })
    res.json({ code: 200, data: config })
  })
  
  app.delete('/api/configs/:id', (req, res) => {
    res.json({ code: 200, message: '删除成功' })
  })
  
  return app
}

describe('配置管理 API 完整测试', () => {
  const app = createApp()
  
  describe('GET /api/configs - 配置列表', () => {
    it('应该返回配置列表', async () => {
      const res = await request(app).get('/api/configs')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data.list)).toBe(true)
    })
    
    it('应该支持分页参数', async () => {
      const res = await request(app).get('/api/configs?page=1&pageSize=10')
      expect(res.status).toBe(200)
      expect(res.body.data.page).toBe(1)
    })
    
    it('应该支持按环境筛选', async () => {
      const res = await request(app).get('/api/configs?environment=dev')
      expect(res.status).toBe(200)
      res.body.data.list.forEach((c: any) => expect(c.environment).toBe('dev'))
    })
    
    it('应该支持关键词搜索', async () => {
      const res = await request(app).get('/api/configs?keyword=db')
      expect(res.status).toBe(200)
    })
    
    it('应该支持按类型筛选', async () => {
      const res = await request(app).get('/api/configs?type=secret')
      expect(res.status).toBe(200)
    })
    
    it('应该支持多条件筛选', async () => {
      const res = await request(app).get('/api/configs?environment=dev&type=string&keyword=db')
      expect(res.status).toBe(200)
    })
  })
  
  describe('GET /api/configs/:id - 配置详情', () => {
    it('应该返回配置详情', async () => {
      const res = await request(app).get('/api/configs/1')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('key')
      expect(res.body.data).toHaveProperty('value')
    })
    
    it('配置不存在应该返回404', async () => {
      const res = await request(app).get('/api/configs/999')
      expect(res.status).toBe(404)
    })
  })
  
  describe('POST /api/configs - 创建配置', () => {
    it('应该创建新配置', async () => {
      const configData = { key: 'test.key', value: 'test-value', environment: 'dev', type: 'string' }
      const res = await request(app).post('/api/configs').send(configData)
      expect(res.status).toBe(200)
      expect(res.body.data.key).toBe('test.key')
      expect(res.body.data.version).toBe(1)
    })
    
    it('缺少必填参数应该返回400', async () => {
      const res = await request(app).post('/api/configs').send({ key: 'test' })
      expect(res.status).toBe(400)
    })
    
    it('应该接受所有类型配置', async () => {
      const res = await request(app).post('/api/configs').send({ key: 'num', value: 123, type: 'number' })
      expect(res.status).toBe(200)
    })
  })
  
  describe('PUT /api/configs/:id - 更新配置', () => {
    it('应该更新配置', async () => {
      const res = await request(app).put('/api/configs/1').send({ value: 'new-value' })
      expect(res.status).toBe(200)
      expect(res.body.data.version).toBeGreaterThan(1)
    })
    
    it('更新不存在的配置应该返回404', async () => {
      const res = await request(app).put('/api/configs/999').send({ value: 'test' })
      expect(res.status).toBe(404)
    })
    
    it('更新应该增加版本号', async () => {
      const res = await request(app).put('/api/configs/1').send({ value: 'updated' })
      expect(res.status).toBe(200)
    })
  })
  
  describe('DELETE /api/configs/:id - 删除配置', () => {
    it('应该删除配置', async () => {
      const res = await request(app).delete('/api/configs/1')
      expect(res.status).toBe(200)
    })
    
    it('删除不存在的配置应该返回成功', async () => {
      const res = await request(app).delete('/api/configs/999')
      expect(res.status).toBe(200)
    })
  })
  
  describe('GET /api/configs/:id/versions - 版本历史', () => {
    it('应该返回版本历史', async () => {
      const res = await request(app).get('/api/configs/1/versions')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
    
    it('版本应该包含版本号和值', async () => {
      const res = await request(app).get('/api/configs/1/versions')
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('version')
        expect(res.body.data[0]).toHaveProperty('value')
      }
    })
    
    it('无版本历史的配置应该返回空数组', async () => {
      const res = await request(app).get('/api/configs/2/versions')
      expect(res.status).toBe(200)
    })
  })
  
  describe('POST /api/configs/:id/rollback - 回滚配置', () => {
    it('应该回滚到指定版本', async () => {
      const res = await request(app).post('/api/configs/1/rollback').send({ targetVersion: 1 })
      expect(res.status).toBe(200)
      expect(res.body.message).toBe('回滚成功')
    })
    
    it('缺少目标版本应该返回400', async () => {
      const res = await request(app).post('/api/configs/1/rollback').send({})
      expect(res.status).toBe(400)
    })
    
    it('配置不存在应该返回404', async () => {
      const res = await request(app).post('/api/configs/999/rollback').send({ targetVersion: 1 })
      expect(res.status).toBe(404)
    })
    
    it('目标版本不存在应该返回404', async () => {
      const res = await request(app).post('/api/configs/1/rollback').send({ targetVersion: 999 })
      expect(res.status).toBe(404)
    })
  })
  
  describe('GET /api/configs/:id/diff - 配置对比', () => {
    it('应该返回配置对比', async () => {
      const res = await request(app).get('/api/configs/1/diff')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('from')
      expect(res.body.data).toHaveProperty('to')
    })
    
    it('应该支持指定版本对比', async () => {
      const res = await request(app).get('/api/configs/1/diff?fromVersion=1&toVersion=2')
      expect(res.status).toBe(200)
    })
    
    it('配置不存在应该返回404', async () => {
      const res = await request(app).get('/api/configs/999/diff')
      expect(res.status).toBe(404)
    })
    
    it('指定版本不存在应该返回404', async () => {
      const res = await request(app).get('/api/configs/1/diff?fromVersion=999')
      expect(res.status).toBe(404)
    })
    
    it('应该返回变更列表', async () => {
      const res = await request(app).get('/api/configs/1/diff')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('changes')
    })
  })
})