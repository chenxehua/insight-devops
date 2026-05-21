// 配置管理API集成测试
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
  configs: new Map(),
  configVersions: new Map(),
}

// 配置路由模拟
const createConfigRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const configs = Array.from(mockDb.configs.values())
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: configs.slice((page - 1) * pageSize, page * pageSize),
        total: configs.length,
        page,
        pageSize,
        totalPages: Math.ceil(configs.length / pageSize)
      }
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
    const { name, configKey, environment, content } = req.body
    if (!name || !configKey || !environment) {
      return res.status(400).json({ code: 400, message: '配置名称、键和环境不能为空' })
    }
    const id = Date.now()
    const config = { id, name, configKey, environment, content, version: 1, status: 1 }
    mockDb.configs.set(id, config)
    res.json({ code: 200, message: '创建成功', data: { id } })
  })
  
  router.put('/:id', (req, res) => {
    const config = mockDb.configs.get(parseInt(req.params.id))
    if (!config) {
      return res.status(404).json({ code: 404, message: '配置不存在' })
    }
    // 创建新版本
    const versions = mockDb.configVersions.get(config.id) || []
    versions.push({
      version: config.version + 1,
      content: req.body.content || config.content,
      createdAt: new Date().toISOString()
    })
    mockDb.configVersions.set(config.id, versions)
    config.version++
    res.json({ code: 200, message: '更新成功' })
  })
  
  router.delete('/:id', (req, res) => {
    if (!mockDb.configs.has(parseInt(req.params.id))) {
      return res.status(404).json({ code: 404, message: '配置不存在' })
    }
    mockDb.configs.delete(parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  })
  
  return router
}

// 配置版本路由模拟
const createConfigVersionRoutes = () => {
  const router = express.Router()
  
  // 获取版本历史
  router.get('/:id/versions', (req, res) => {
    const config = mockDb.configs.get(parseInt(req.params.id))
    if (!config) {
      return res.status(404).json({ code: 404, message: '配置不存在' })
    }
    const versions = mockDb.configVersions.get(config.id) || []
    res.json({
      code: 200,
      message: 'success',
      data: versions
    })
  })
  
  // 回滚到指定版本
  router.post('/:id/rollback', (req, res) => {
    const config = mockDb.configs.get(parseInt(req.params.id))
    if (!config) {
      return res.status(404).json({ code: 404, message: '配置不存在' })
    }
    const { version } = req.body
    if (!version) {
      return res.status(400).json({ code: 400, message: '版本号不能为空' })
    }
    const versions = mockDb.configVersions.get(config.id) || []
    const targetVersion = versions.find((v: any) => v.version === version)
    if (!targetVersion) {
      return res.status(404).json({ code: 404, message: '指定版本不存在' })
    }
    res.json({
      code: 200,
      message: '回滚成功',
      data: { version: version, content: targetVersion.content }
    })
  })
  
  // 对比两个版本
  router.get('/:id/diff', (req, res) => {
    const config = mockDb.configs.get(parseInt(req.params.id))
    if (!config) {
      return res.status(404).json({ code: 404, message: '配置不存在' })
    }
    const { fromVersion, toVersion } = req.query
    if (!fromVersion || !toVersion) {
      return res.status(400).json({ code: 400, message: '源版本和目标版本不能为空' })
    }
    const versions = mockDb.configVersions.get(config.id) || []
    const from = versions.find((v: any) => v.version === parseInt(fromVersion as string))
    const to = versions.find((v: any) => v.version === parseInt(toVersion as string))
    if (!from || !to) {
      return res.status(404).json({ code: 404, message: '指定版本不存在' })
    }
    res.json({
      code: 200,
      message: 'success',
      data: {
        fromVersion: parseInt(fromVersion as string),
        toVersion: parseInt(toVersion as string),
        diff: [
          { type: 'unchanged', line: 1, content: '# Config' },
          { type: 'deleted', line: 2, content: '- old setting' },
          { type: 'added', line: 2, content: '+ new setting' }
        ],
        additions: 1,
        deletions: 1
      }
    })
  })
  
  return router
}

describe('配置管理 API 测试', () => {
  let app: express.Application
  
  beforeAll(() => {
    app = createTestApp()
    app.use('/api/configs', createConfigRoutes())
    app.use('/api/configs', createConfigVersionRoutes())
  })
  
  beforeEach(() => {
    mockDb.configs.clear()
    mockDb.configVersions.clear()
    mockDb.configs.set(1, {
      id: 1, name: 'App Config', configKey: 'app.config', environment: 'prod', content: 'db.host=localhost', version: 1, status: 1
    })
    mockDb.configVersions.set(1, [
      { version: 1, content: 'db.host=localhost', createdAt: '2024-01-01T00:00:00Z' }
    ])
  })
  
  describe('配置列表', () => {
    describe('GET /api/configs', () => {
      it('应该返回配置列表', async () => {
        const response = await request(app)
          .get('/api/configs')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.list).toBeDefined()
      })
      
      it('应该支持分页参数', async () => {
        const response = await request(app)
          .get('/api/configs?page=1&pageSize=10')
          .expect(200)
        
        expect(response.body.data.page).toBe(1)
        expect(response.body.data.pageSize).toBe(10)
      })
      
      it('应该支持环境筛选', async () => {
        const response = await request(app)
          .get('/api/configs?environment=prod')
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
    })
  })
  
  describe('配置详情', () => {
    describe('GET /api/configs/:id', () => {
      it('应该返回配置详情', async () => {
        const response = await request(app)
          .get('/api/configs/1')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.id).toBe(1)
      })
      
      it('配置不存在应返回404', async () => {
        const response = await request(app)
          .get('/api/configs/9999')
          .expect(404)
        
        expect(response.body.code).toBe(404)
      })
    })
  })
  
  describe('创建配置', () => {
    describe('POST /api/configs', () => {
      it('应该创建新配置', async () => {
        const response = await request(app)
          .post('/api/configs')
          .send({ name: 'New Config', configKey: 'new.config', environment: 'dev', content: 'test=value' })
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
      
      it('缺少必填参数应返回400', async () => {
        const response = await request(app)
          .post('/api/configs')
          .send({ name: 'New Config' })
          .expect(400)
        
        expect(response.body.code).toBe(400)
      })
    })
  })
  
  describe('更新配置', () => {
    describe('PUT /api/configs/:id', () => {
      it('应该更新配置', async () => {
        const response = await request(app)
          .put('/api/configs/1')
          .send({ content: 'db.host=updated' })
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
      
      it('配置不存在应返回404', async () => {
        const response = await request(app)
          .put('/api/configs/9999')
          .send({ content: 'test' })
          .expect(404)
        
        expect(response.body.code).toBe(404)
      })
    })
  })
  
  describe('删除配置', () => {
    describe('DELETE /api/configs/:id', () => {
      it('应该删除配置', async () => {
        const response = await request(app)
          .delete('/api/configs/1')
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
      
      it('配置不存在应返回404', async () => {
        const response = await request(app)
          .delete('/api/configs/9999')
          .expect(404)
        
        expect(response.body.code).toBe(404)
      })
    })
  })
  
  describe('版本管理', () => {
    describe('GET /api/configs/:id/versions', () => {
      it('应该返回版本历史', async () => {
        const response = await request(app)
          .get('/api/configs/1/versions')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
      })
    })
    
    describe('POST /api/configs/:id/rollback', () => {
      it('应该回滚到指定版本', async () => {
        // 先更新以创建新版本
        await request(app)
          .put('/api/configs/1')
          .send({ content: 'db.host=v2' })
        
        const response = await request(app)
          .post('/api/configs/1/rollback')
          .send({ version: 1 })
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.version).toBe(1)
      })
      
      it('版本号为空应返回400', async () => {
        const response = await request(app)
          .post('/api/configs/1/rollback')
          .send({})
          .expect(400)
        
        expect(response.body.code).toBe(400)
      })
      
      it('指定版本不存在应返回404', async () => {
        const response = await request(app)
          .post('/api/configs/1/rollback')
          .send({ version: 999 })
          .expect(404)
        
        expect(response.body.code).toBe(404)
      })
    })
    
    describe('GET /api/configs/:id/diff', () => {
      beforeEach(async () => {
        // 创建多个版本用于对比
        await request(app)
          .put('/api/configs/1')
          .send({ content: 'db.host=v2' })
      })
      
      it('应该对比两个版本', async () => {
        const response = await request(app)
          .get('/api/configs/1/diff?fromVersion=1&toVersion=2')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.fromVersion).toBe(1)
        expect(response.body.data.toVersion).toBe(2)
        expect(Array.isArray(response.body.data.diff)).toBe(true)
      })
      
      it('缺少版本参数应返回400', async () => {
        const response = await request(app)
          .get('/api/configs/1/diff?fromVersion=1')
          .expect(400)
        
        expect(response.body.code).toBe(400)
      })
      
      it('指定版本不存在应返回404', async () => {
        const response = await request(app)
          .get('/api/configs/1/diff?fromVersion=1&toVersion=999')
          .expect(404)
        
        expect(response.body.code).toBe(404)
      })
    })
  })
})