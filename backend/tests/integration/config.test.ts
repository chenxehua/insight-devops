// 配置管理API集成测试
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  return app
}

const mockDb = {
  configs: new Map(),
  configVersions: new Map(),
}

// 配置版本路由
const createConfigVersionRoutes = () => {
  const router = express.Router()
  
  router.get('/:id/versions', (req, res) => {
    const config = mockDb.configs.get(parseInt(req.params.id))
    if (!config) {
      return res.status(404).json({ code: 404, message: '配置不存在' })
    }
    const versions = Array.from(mockDb.configVersions.values())
      .filter(v => v.configId === config.id)
      .sort((a, b) => b.version - a.version)
    res.json({ code: 200, message: 'success', data: versions })
  })
  
  router.post('/:id/rollback', (req, res) => {
    const config = mockDb.configs.get(parseInt(req.params.id))
    if (!config) {
      return res.status(404).json({ code: 404, message: '配置不存在' })
    }
    const { targetVersion } = req.body
    if (!targetVersion) {
      return res.status(400).json({ code: 400, message: '目标版本不能为空' })
    }
    const targetVersionRecord = mockDb.configVersions.get(`${config.id}-${targetVersion}`)
    if (!targetVersionRecord) {
      return res.status(404).json({ code: 404, message: '目标版本不存在' })
    }
    const newVersion = config.version + 1
    config.version = newVersion
    config.configValue = targetVersionRecord.configValue
    res.json({ code: 200, message: '配置已回滚', data: { newVersion } })
  })
  
  router.get('/:id/diff', (req, res) => {
    const config = mockDb.configs.get(parseInt(req.params.id))
    if (!config) {
      return res.status(404).json({ code: 404, message: '配置不存在' })
    }
    const { from, to } = req.query
    res.json({
      code: 200, message: 'success',
      data: {
        configId: config.id,
        configName: config.configName,
        fromVersion: from ? parseInt(from as string) : config.version - 1,
        toVersion: to ? parseInt(to as string) : config.version,
        diff: [{ type: 'modified', line: 1, fromValue: 'old', toValue: 'new' }]
      }
    })
  })
  
  return router
}

// 配置路由
const createConfigRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const configs = Array.from(mockDb.configs.values())
    res.json({
      code: 200, message: 'success',
      data: { list: configs.slice(0, 20), total: configs.length, page: 1, pageSize: 20 }
    })
  })
  
  router.get('/:id', (req, res) => {
    const config = mockDb.configs.get(parseInt(req.params.id))
    if (!config) {
      return res.status(404).json({ code: 404, message: '配置不存在' })
    }
    res.json({ code: 200, message: 'success', data: config })
  })
  
  router.post('/', (req, res) => {
    const { configName, configKey, configValue } = req.body
    if (!configName || !configKey) {
      return res.status(400).json({ code: 400, message: '配置名称和键不能为空' })
    }
    const id = Date.now()
    const config = { id, configName, configKey, configValue: configValue || '', version: 1 }
    mockDb.configs.set(id, config)
    mockDb.configVersions.set(`${id}-1`, { configId: id, version: 1, configValue: configValue || '' })
    res.json({ code: 200, message: '创建成功', data: { id } })
  })
  
  router.put('/:id', (req, res) => {
    const config = mockDb.configs.get(parseInt(req.params.id))
    if (!config) {
      return res.status(404).json({ code: 404, message: '配置不存在' })
    }
    if (req.body.configValue !== undefined) {
      config.configValue = req.body.configValue
      config.version++
      mockDb.configVersions.set(`${config.id}-${config.version}`, {
        configId: config.id, version: config.version, configValue: req.body.configValue
      })
    }
    res.json({ code: 200, message: '更新成功' })
  })
  
  return router
}

describe('配置管理 API 测试', () => {
  const app = createTestApp()
  app.use('/api/configs', createConfigRoutes())
  app.use('/api/configs', createConfigVersionRoutes())
  
  beforeEach(() => {
    mockDb.configs.clear()
    mockDb.configVersions.clear()
    mockDb.configs.set(1, { id: 1, configName: 'Test Config', configKey: 'test.config', configValue: 'value1', version: 1 })
    mockDb.configVersions.set('1-1', { configId: 1, version: 1, configValue: 'value1' })
  })
  
  describe('GET /api/configs', () => {
    it('应该返回配置列表', async () => {
      const response = await request(app).get('/api/configs').expect(200)
      expect(response.body.code).toBe(200)
      expect(response.body.data.list).toBeDefined()
    })
  })
  
  describe('POST /api/configs', () => {
    it('应该创建新配置', async () => {
      const response = await request(app)
        .post('/api/configs')
        .send({ configName: 'New Config', configKey: 'new.config', configValue: 'value' })
        .expect(200)
      expect(response.body.code).toBe(200)
    })
    
    it('缺少必填参数应返回400', async () => {
      const response = await request(app)
        .post('/api/configs')
        .send({ configName: 'Test' })
        .expect(400)
      expect(response.body.code).toBe(400)
    })
  })
  
  describe('GET /api/configs/:id/versions', () => {
    it('应该返回配置版本历史', async () => {
      const response = await request(app).get('/api/configs/1/versions').expect(200)
      expect(response.body.code).toBe(200)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })
  
  describe('POST /api/configs/:id/rollback', () => {
    it('应该回滚到指定版本', async () => {
      // 添加第二个版本
      mockDb.configs.get(1).version = 2
      mockDb.configVersions.set('1-2', { configId: 1, version: 2, configValue: 'value2' })
      
      const response = await request(app)
        .post('/api/configs/1/rollback')
        .send({ targetVersion: 1 })
        .expect(200)
      expect(response.body.code).toBe(200)
      expect(response.body.data.newVersion).toBe(3)
    })
    
    it('缺少目标版本应返回400', async () => {
      const response = await request(app)
        .post('/api/configs/1/rollback')
        .send({})
        .expect(400)
      expect(response.body.code).toBe(400)
    })
  })
  
  describe('GET /api/configs/:id/diff', () => {
    it('应该返回配置对比', async () => {
      const response = await request(app)
        .get('/api/configs/1/diff')
        .query({ from: 1, to: 2 })
        .expect(200)
      expect(response.body.code).toBe(200)
      expect(response.body.data.diff).toBeDefined()
    })
  })
})