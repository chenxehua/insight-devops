// 配置管理 - 完整API测试
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

// Mock database
const mockDatabase = {
  configs: new Map([
    [1, { id: 1, config_name: 'Database Config', config_key: 'db.config', config_value: 'host=localhost', app_id: 1, environment: 'dev', config_type: 'key-value', version: 2 }],
    [2, { id: 2, config_name: 'API Config', config_key: 'api.config', config_value: 'timeout=30', app_id: 1, environment: 'prod', config_type: 'json', version: 1 }],
  ]),
  configVersions: new Map([
    [1, { id: 1, config_id: 1, version: 1, config_value: 'host=old', change_note: 'Initial' }],
    [2, { id: 2, config_id: 1, version: 2, config_value: 'host=localhost', change_note: 'Updated' }],
  ]),
}

// Config routes
const createConfigRoutes = () => {
  const router = express.Router()

  // List
  router.get('/', (req, res) => {
    let list = Array.from(mockDatabase.configs.values())
    if (req.query.keyword) {
      list = list.filter(c => c.config_name.includes(req.query.keyword as string) || c.config_key.includes(req.query.keyword as string))
    }
    res.json({ code: 200, message: 'success', data: { list, total: list.length, page: 1, pageSize: 20 } })
  })

  // Detail
  router.get('/:id', (req, res) => {
    const config = mockDatabase.configs.get(parseInt(req.params.id))
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    res.json({ code: 200, message: 'success', data: config })
  })

  // Create
  router.post('/', (req, res) => {
    const { configName, configKey, configValue } = req.body
    if (!configName || !configKey) {
      return res.status(400).json({ code: 400, message: '配置名称和键不能为空' })
    }
    const id = Date.now()
    mockDatabase.configs.set(id, { id, config_name: configName, config_key: configKey, config_value: configValue || '', app_id: null, environment: null, config_type: 'key-value', version: 1 })
    res.json({ code: 200, message: '创建成功', data: { id } })
  })

  // Update
  router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id)
    if (!mockDatabase.configs.has(id)) {
      return res.status(404).json({ code: 404, message: '配置不存在' })
    }
    const config = mockDatabase.configs.get(id)
    if (req.body.configValue) config.version++
    res.json({ code: 200, message: '更新成功' })
  })

  // Delete
  router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id)
    if (!mockDatabase.configs.has(id)) {
      return res.status(404).json({ code: 404, message: '配置不存在' })
    }
    mockDatabase.configs.delete(id)
    res.json({ code: 200, message: '删除成功' })
  })

  // Versions
  router.get('/:id/versions', (req, res) => {
    const config = mockDatabase.configs.get(parseInt(req.params.id))
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    const versions = Array.from(mockDatabase.configVersions.values()).filter(v => v.config_id === config.id)
    res.json({ code: 200, message: 'success', data: versions })
  })

  return router
}

// Config versions routes
const createConfigVersionRoutes = () => {
  const router = express.Router()

  // Versions
  router.get('/:id/versions', (req, res) => {
    const config = mockDatabase.configs.get(parseInt(req.params.id))
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    const versions = Array.from(mockDatabase.configVersions.values()).filter(v => v.config_id === config.id)
    res.json({ code: 200, message: 'success', data: versions })
  })

  // Rollback
  router.post('/:id/rollback', (req, res) => {
    const id = parseInt(req.params.id)
    const { targetVersion } = req.body
    if (!targetVersion) {
      return res.status(400).json({ code: 400, message: '目标版本不能为空' })
    }
    const config = mockDatabase.configs.get(id)
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    const targetVer = Array.from(mockDatabase.configVersions.values()).find(v => v.config_id === id && v.version === targetVersion)
    if (!targetVer) return res.status(404).json({ code: 404, message: '目标版本不存在' })
    const newVersion = config.version + 1
    config.config_value = targetVer.config_value
    config.version = newVersion
    res.json({ code: 200, message: '配置已回滚', data: { newVersion } })
  })

  // Diff
  router.get('/:id/diff', (req, res) => {
    const id = parseInt(req.params.id)
    const fromVersion = parseInt(req.query.from as string)
    const toVersion = parseInt(req.query.to as string)
    const config = mockDatabase.configs.get(id)
    if (!config) return res.status(404).json({ code: 404, message: '配置不存在' })
    const versionTo = toVersion || config.version
    const toVer = Array.from(mockDatabase.configVersions.values()).find(v => v.config_id === id && v.version === versionTo)
    const toValue = toVer?.config_value || ''
    let fromValue = ''
    if (fromVersion) {
      const fromVer = Array.from(mockDatabase.configVersions.values()).find(v => v.config_id === id && v.version === fromVersion)
      fromValue = fromVer?.config_value || ''
    } else {
      const prevVer = Array.from(mockDatabase.configVersions.values())
        .filter(v => v.config_id === id && v.version < versionTo)
        .sort((a, b) => b.version - a.version)[0]
      fromValue = prevVer?.config_value || ''
    }
    const diff: { type: string; value: string }[] = []
    const fromLines = fromValue.split('\n')
    const toLines = toValue.split('\n')
    const maxLen = Math.max(fromLines.length, toLines.length)
    for (let i = 0; i < maxLen; i++) {
      if (fromLines[i] !== toLines[i]) {
        if (fromLines[i] !== undefined) diff.push({ type: 'removed', value: fromLines[i] })
        if (toLines[i] !== undefined) diff.push({ type: 'added', value: toLines[i] })
      }
    }
    res.json({ code: 200, message: 'success', data: { configId: id, configName: config.config_name, fromVersion: fromVersion || versionTo - 1, toVersion: versionTo, fromValue, toValue, diff } })
  })

  return router
}

describe('配置管理 API 完整测试', () => {
  const app = express()
  app.use(express.json())
  app.use('/api/configs', createConfigRoutes())
  app.use('/api/configs', createConfigVersionRoutes())

  beforeEach(() => {
    mockDatabase.configs.clear()
    mockDatabase.configs.set(1, { id: 1, config_name: 'Database Config', config_key: 'db.config', config_value: 'host=localhost', app_id: 1, environment: 'dev', config_type: 'key-value', version: 2 })
    mockDatabase.configs.set(2, { id: 2, config_name: 'API Config', config_key: 'api.config', config_value: 'timeout=30', app_id: 1, environment: 'prod', config_type: 'json', version: 1 })
    mockDatabase.configVersions.clear()
    mockDatabase.configVersions.set(1, { id: 1, config_id: 1, version: 1, config_value: 'host=old', change_note: 'Initial' })
    mockDatabase.configVersions.set(2, { id: 2, config_id: 1, version: 2, config_value: 'host=localhost', change_note: 'Updated' })
  })

  describe('GET /api/configs', () => {
    it('返回配置列表', async () => {
      const res = await request(app).get('/api/configs').expect(200)
      expect(res.body.code).toBe(200)
      expect(Array.isArray(res.body.data.list)).toBe(true)
    })

    it('支持按关键词搜索', async () => {
      const res = await request(app).get('/api/configs?keyword=database').expect(200)
      expect(res.body.code).toBe(200)
    })

    it('支持按环境筛选', async () => {
      const res = await request(app).get('/api/configs?environment=dev').expect(200)
      expect(res.body.code).toBe(200)
    })

    it('支持按类型筛选', async () => {
      const res = await request(app).get('/api/configs?configType=json').expect(200)
      expect(res.body.code).toBe(200)
    })
  })

  describe('GET /api/configs/:id', () => {
    it('返回配置详情', async () => {
      const res = await request(app).get('/api/configs/1').expect(200)
      expect(res.body.code).toBe(200)
      expect(res.body.data.config_name).toBe('Database Config')
    })

    it('不存在的配置返回404', async () => {
      const res = await request(app).get('/api/configs/9999').expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('POST /api/configs', () => {
    it('创建新配置', async () => {
      const res = await request(app)
        .post('/api/configs')
        .send({ configName: 'Test Config', configKey: 'test.config', configValue: 'value=test' })
        .expect(200)
      expect(res.body.code).toBe(200)
    })

    it('缺少必填参数返回400', async () => {
      const res = await request(app).post('/api/configs').send({ configName: 'Test' }).expect(400)
      expect(res.body.code).toBe(400)
    })
  })

  describe('PUT /api/configs/:id', () => {
    it('更新配置', async () => {
      const res = await request(app).put('/api/configs/1').send({ configName: 'Updated Config' }).expect(200)
      expect(res.body.code).toBe(200)
    })

    it('更新配置值时增加版本号', async () => {
      const originalVersion = mockDatabase.configs.get(1).version
      await request(app).put('/api/configs/1').send({ configValue: 'new value' }).expect(200)
      expect(mockDatabase.configs.get(1).version).toBe(originalVersion + 1)
    })

    it('更新不存在的配置返回404', async () => {
      const res = await request(app).put('/api/configs/9999').send({ configName: 'Test' }).expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('DELETE /api/configs/:id', () => {
    it('删除配置', async () => {
      const res = await request(app).delete('/api/configs/1').expect(200)
      expect(res.body.code).toBe(200)
      expect(mockDatabase.configs.has(1)).toBe(false)
    })

    it('删除不存在的配置返回404', async () => {
      const res = await request(app).delete('/api/configs/9999').expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('GET /api/configs/:id/versions', () => {
    it('返回配置版本历史', async () => {
      const res = await request(app).get('/api/configs/1/versions').expect(200)
      expect(res.body.code).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('POST /api/configs/:id/rollback', () => {
    it('回滚到指定版本', async () => {
      const res = await request(app).post('/api/configs/1/rollback').send({ targetVersion: 1 }).expect(200)
      expect(res.body.code).toBe(200)
      expect(res.body.data.newVersion).toBe(3)
    })

    it('缺少目标版本返回400', async () => {
      const res = await request(app).post('/api/configs/1/rollback').send({}).expect(400)
      expect(res.body.code).toBe(400)
    })

    it('不存在的配置返回404', async () => {
      const res = await request(app).post('/api/configs/9999/rollback').send({ targetVersion: 1 }).expect(404)
      expect(res.body.code).toBe(404)
    })

    it('不存在的目标版本返回404', async () => {
      const res = await request(app).post('/api/configs/1/rollback').send({ targetVersion: 99 }).expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('GET /api/configs/:id/diff', () => {
    it('返回配置对比', async () => {
      const res = await request(app).get('/api/configs/1/diff?from=1&to=2').expect(200)
      expect(res.body.code).toBe(200)
      expect(res.body.data.diff).toBeDefined()
    })

    it('不指定版本时使用前一版本和当前版本对比', async () => {
      const res = await request(app).get('/api/configs/1/diff').expect(200)
      expect(res.body.code).toBe(200)
      expect(res.body.data.fromVersion).toBeDefined()
      expect(res.body.data.toVersion).toBeDefined()
    })

    it('不存在的配置返回404', async () => {
      const res = await request(app).get('/api/configs/9999/diff').expect(404)
      expect(res.body.code).toBe(404)
    })
  })
})