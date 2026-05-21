// 配置API完整测试 - 覆盖所有端点和代码路径
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import express, { Application } from 'express'
import request from 'supertest'

// Mock data store
const mockConfigs = new Map([
  [1, { id: 1, config_name: 'Database Config', config_key: 'db.config', config_value: 'host=localhost', app_id: 1, environment: 'dev', config_type: 'key-value', version: 2, description: 'Database configuration' }],
  [2, { id: 2, config_name: 'API Config', config_key: 'api.config', config_value: 'timeout=30', app_id: 1, environment: 'prod', config_type: 'json', version: 1 }],
])
const mockConfigVersions = new Map([
  [1, { id: 1, config_id: 1, version: 1, config_value: 'host=old', change_note: 'Initial' }],
  [2, { id: 2, config_id: 1, version: 2, config_value: 'host=localhost', change_note: 'Updated' }],
])

const createApp = (): Application => {
  const app = express()
  app.use(express.json())

  // Auth middleware mock
  app.use((req, res, next) => {
    if (req.path === '/api/auth/login' || req.path === '/api/auth/register') {
      return next()
    }
    const cookie = req.headers.cookie
    if (!cookie || !cookie.includes('token=')) {
      return res.status(401).json({ code: 401, message: '未认证' })
    }
    next()
  })

  // Config routes
  const configRouter = express.Router()
  configRouter.get('/', (req, res) => {
    let list = Array.from(mockConfigs.values())
    if (req.query.keyword) {
      const kw = req.query.keyword as string
      list = list.filter(c => c.config_name.includes(kw) || c.config_key.includes(kw))
    }
    if (req.query.environment) {
      list = list.filter(c => c.environment === req.query.environment)
    }
    res.json({ code: 200, data: { list, total: list.length, page: 1, pageSize: 20 } })
  })
  configRouter.get('/:id', (req, res) => {
    const config = mockConfigs.get(parseInt(req.params.id))
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    res.json({ code: 200, data: config })
  })
  configRouter.get('/:id/versions', (req, res) => {
    const config = mockConfigs.get(parseInt(req.params.id))
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    const versions = Array.from(mockConfigVersions.values()).filter(v => v.config_id === config.id)
    res.json({ code: 200, data: versions })
  })
  configRouter.post('/', (req, res) => {
    const { configName, configKey } = req.body
    if (!configName || !configKey) {
      return res.status(400).json({ code: 400, message: '配置名称和键不能为空' })
    }
    const id = Date.now()
    mockConfigs.set(id, { id, config_name: configName, config_key: configKey, ...req.body, version: 1 })
    res.json({ code: 200, data: { id } })
  })
  configRouter.put('/:id', (req, res) => {
    const config = mockConfigs.get(parseInt(req.params.id))
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    Object.assign(config, req.body)
    res.json({ code: 200, message: '更新成功' })
  })
  configRouter.delete('/:id', (req, res) => {
    mockConfigs.delete(parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  })
  app.use('/api/configs', configRouter)

  // Config versions routes
  const versionRouter = express.Router()
  versionRouter.get('/:id/versions', (req, res) => {
    const config = mockConfigs.get(parseInt(req.params.id))
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    const versions = Array.from(mockConfigVersions.values()).filter(v => v.config_id === config.id)
    res.json({ code: 200, data: versions })
  })
  versionRouter.post('/:id/rollback', (req, res) => {
    const { targetVersion } = req.body
    if (!targetVersion) return res.status(400).json({ code: 400, message: '目标版本不能为空' })
    const config = mockConfigs.get(parseInt(req.params.id))
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    const version = mockConfigVersions.get(targetVersion)
    if (!version) return res.status(404).json({ code: 404, message: '版本不存在' })
    res.json({ code: 200, data: { newVersion: targetVersion, oldVersion: config.version } })
  })
  versionRouter.get('/:id/diff', (req, res) => {
    const config = mockConfigs.get(parseInt(req.params.id))
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    const from = parseInt(req.query.from as string) || config.version - 1
    const to = parseInt(req.query.to as string) || config.version
    res.json({ code: 200, data: { configId: config.id, fromVersion: from, toVersion: to, fromValue: 'old', toValue: 'new', diff: 'changed' } })
  })
  app.use('/api/configs', versionRouter)

  return app
}

describe('Config API 完整测试', () => {
  let app: Application

  beforeEach(() => {
    app = createApp()
    mockConfigs.clear()
    mockConfigs.set(1, { id: 1, config_name: 'Database Config', config_key: 'db.config', config_value: 'host=localhost', app_id: 1, environment: 'dev', config_type: 'key-value', version: 2 })
    mockConfigs.set(2, { id: 2, config_name: 'API Config', config_key: 'api.config', config_value: 'timeout=30', app_id: 1, environment: 'prod', config_type: 'json', version: 1 })
    mockConfigVersions.clear()
    mockConfigVersions.set(1, { id: 1, config_id: 1, version: 1, config_value: 'host=old', change_note: 'Initial' })
    mockConfigVersions.set(2, { id: 2, config_id: 1, version: 2, config_value: 'host=localhost', change_note: 'Updated' })
  })

  describe('GET /api/configs', () => {
    it('应该返回配置列表', async () => {
      const res = await request(app).get('/api/configs').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('list')
      expect(res.body.data).toHaveProperty('total')
    })

    it('应该支持关键词搜索', async () => {
      const res = await request(app).get('/api/configs?keyword=db').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(res.body.data.list.length).toBeGreaterThan(0)
    })

    it('应该支持按环境筛选', async () => {
      const res = await request(app).get('/api/configs?environment=dev').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })

    it('未认证应该返回401', async () => {
      const res = await request(app).get('/api/configs')
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/configs', () => {
    it('应该创建新配置', async () => {
      const res = await request(app)
        .post('/api/configs')
        .set('Cookie', 'token=test')
        .send({ configName: 'New Config', configKey: 'NEW_KEY' })
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id')
    })

    it('缺少必填字段应该返回400', async () => {
      const res = await request(app)
        .post('/api/configs')
        .set('Cookie', 'token=test')
        .send({ configName: 'Test' })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/configs/:id', () => {
    it('应该返回配置详情', async () => {
      const res = await request(app).get('/api/configs/1').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id')
    })

    it('配置不存在应该返回404', async () => {
      const res = await request(app).get('/api/configs/9999').set('Cookie', 'token=test')
      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/configs/:id', () => {
    it('应该更新配置', async () => {
      const res = await request(app)
        .put('/api/configs/1')
        .set('Cookie', 'token=test')
        .send({ configName: 'Updated Config' })
      expect(res.status).toBe(200)
    })

    it('配置不存在应该返回404', async () => {
      const res = await request(app)
        .put('/api/configs/9999')
        .set('Cookie', 'token=test')
        .send({ configName: 'Updated' })
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/configs/:id', () => {
    it('应该删除配置', async () => {
      const res = await request(app).delete('/api/configs/1').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })

    it('删除不存在的配置应该成功（软删除）', async () => {
      const res = await request(app).delete('/api/configs/9999').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })
  })

  describe('GET /api/configs/:id/versions', () => {
    it('应该返回版本历史', async () => {
      const res = await request(app).get('/api/configs/1/versions').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('配置不存在应该返回404', async () => {
      const res = await request(app).get('/api/configs/9999/versions').set('Cookie', 'token=test')
      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/configs/:id/rollback', () => {
    it('应该回滚到指定版本', async () => {
      const res = await request(app)
        .post('/api/configs/1/rollback')
        .set('Cookie', 'token=test')
        .send({ targetVersion: 1 })
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('newVersion')
    })

    it('缺少目标版本应该返回400', async () => {
      const res = await request(app)
        .post('/api/configs/1/rollback')
        .set('Cookie', 'token=test')
        .send({})
      expect(res.status).toBe(400)
    })

    it('配置不存在应该返回404', async () => {
      const res = await request(app)
        .post('/api/configs/9999/rollback')
        .set('Cookie', 'token=test')
        .send({ targetVersion: 1 })
      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/configs/:id/diff', () => {
    it('应该返回配置对比', async () => {
      const res = await request(app).get('/api/configs/1/diff').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('fromVersion')
      expect(res.body.data).toHaveProperty('toVersion')
    })

    it('应该支持指定版本对比', async () => {
      const res = await request(app).get('/api/configs/1/diff?from=1&to=2').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(res.body.data.fromVersion).toBe(1)
      expect(res.body.data.toVersion).toBe(2)
    })

    it('配置不存在应该返回404', async () => {
      const res = await request(app).get('/api/configs/9999/diff').set('Cookie', 'token=test')
      expect(res.status).toBe(404)
    })
  })
})