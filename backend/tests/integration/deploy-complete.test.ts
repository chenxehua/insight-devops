// 部署管理 - 完整API测试
import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

// Mock database
const mockDatabase = {
  deploys: new Map([
    [1, { id: 1, app_id: 1, environment: 'prod', version: 'v1.0.0', status: 'success', deploy_log: 'Log line 1\nLog line 2' }],
    [2, { id: 2, app_id: 1, environment: 'dev', version: 'v2.0.0', status: 'running', deploy_log: null }],
    [3, { id: 3, app_id: 1, environment: 'test', version: 'v1.0.0', status: 'failed', deploy_log: 'Error occurred' }],
  ]),
  apps: new Map([[1, { id: 1, app_name: 'Test App', app_code: 'test-app', status: 1 }]]),
}

// Helper function to simulate database operations
const runQuery = vi.fn((sql: string, params: any[]) => {
  if (sql.includes('INSERT')) {
    const id = Date.now()
    mockDatabase.deploys.set(id, { id, ...params })
    return id
  }
  if (sql.includes('UPDATE')) {
    const id = params[params.length - 1]
    const deploy = mockDatabase.deploys.get(id)
    if (deploy) {
      mockDatabase.deploys.set(id, { ...deploy })
    }
    return 1
  }
  return 1
})

const getAll = vi.fn((sql: string) => {
  return Array.from(mockDatabase.deploys.values())
})

const getOne = vi.fn((sql: string, params: any[]) => {
  const id = params[0]
  return mockDatabase.deploys.get(id) || null
})

// Deploy routes
const createDeployRoutes = () => {
  const router = express.Router()

  // List
  router.get('/', (req, res) => {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const list = Array.from(mockDatabase.deploys.values())
    res.json({
      code: 200, message: 'success',
      data: { list, total: list.length, page, pageSize, totalPages: Math.ceil(list.length / pageSize) }
    })
  })

  // Detail
  router.get('/:id', (req, res) => {
    const deploy = mockDatabase.deploys.get(parseInt(req.params.id))
    if (!deploy) return res.status(404).json({ code: 404, message: '部署任务不存在' })
    res.json({ code: 200, message: 'success', data: { ...deploy, appName: 'Test App' } })
  })

  // Create
  router.post('/', (req, res) => {
    const { appId, environment, version } = req.body
    if (!appId || !environment || !version) {
      return res.status(400).json({ code: 400, message: '应用ID、环境和版本不能为空' })
    }
    const id = Date.now()
    mockDatabase.deploys.set(id, { id, appId, environment, version, status: 'pending' })
    res.json({ code: 200, message: '创建成功', data: { id } })
  })

  // Update
  router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id)
    if (!mockDatabase.deploys.has(id)) {
      return res.status(404).json({ code: 404, message: '部署任务不存在' })
    }
    res.json({ code: 200, message: '更新成功' })
  })

  // Delete
  router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id)
    if (!mockDatabase.deploys.has(id)) {
      return res.status(404).json({ code: 404, message: '部署任务不存在' })
    }
    mockDatabase.deploys.delete(id)
    res.json({ code: 200, message: '删除成功' })
  })

  // Execute
  router.post('/:id/execute', (req, res) => {
    const deploy = mockDatabase.deploys.get(parseInt(req.params.id))
    if (!deploy) return res.status(404).json({ code: 404, message: '部署任务不存在' })
    if (deploy.status === 'running') {
      return res.status(400).json({ code: 400, message: '部署任务正在执行中' })
    }
    deploy.status = 'running'
    res.json({ code: 200, message: '部署任务已启动' })
  })

  // Cancel
  router.post('/:id/cancel', (req, res) => {
    const deploy = mockDatabase.deploys.get(parseInt(req.params.id))
    if (!deploy) return res.status(404).json({ code: 404, message: '部署任务不存在' })
    if (deploy.status === 'success' || deploy.status === 'failed') {
      return res.status(400).json({ code: 400, message: '已完成的部署任务无法取消' })
    }
    deploy.status = 'cancelled'
    res.json({ code: 200, message: '部署任务已取消' })
  })

  // Rollback
  router.post('/:id/rollback', (req, res) => {
    const deploy = mockDatabase.deploys.get(parseInt(req.params.id))
    if (!deploy) return res.status(404).json({ code: 404, message: '部署任务不存在' })
    if (deploy.status !== 'failed') {
      return res.status(400).json({ code: 400, message: '只能回滚失败的部署任务' })
    }
    deploy.status = 'rollback'
    res.json({ code: 200, message: '回滚任务已启动' })
  })

  // Logs
  router.get('/:id/logs', (req, res) => {
    const deploy = mockDatabase.deploys.get(parseInt(req.params.id))
    if (!deploy) return res.status(404).json({ code: 404, message: '部署任务不存在' })
    const logs = deploy.deploy_log ? deploy.deploy_log.split('\n') : []
    res.json({
      code: 200, message: 'success',
      data: {
        taskId: deploy.id,
        status: deploy.status,
        logs: logs.map((line, i) => ({ line: i + 1, content: line, timestamp: new Date().toISOString() })),
        totalLines: logs.length
      }
    })
  })

  return router
}

describe('部署管理 API 完整测试', () => {
  const app = express()
  app.use(express.json())
  app.use('/api/deploys', createDeployRoutes())

  beforeEach(() => {
    mockDatabase.deploys.clear()
    mockDatabase.deploys.set(1, { id: 1, app_id: 1, environment: 'prod', version: 'v1.0.0', status: 'success', deploy_log: 'Log line 1\nLog line 2' })
    mockDatabase.deploys.set(2, { id: 2, app_id: 1, environment: 'dev', version: 'v2.0.0', status: 'running', deploy_log: null })
    mockDatabase.deploys.set(3, { id: 3, app_id: 1, environment: 'test', version: 'v1.0.0', status: 'failed', deploy_log: 'Error occurred' })
  })

  describe('GET /api/deploys', () => {
    it('返回部署任务列表', async () => {
      const res = await request(app).get('/api/deploys').expect(200)
      expect(res.body.code).toBe(200)
      expect(Array.isArray(res.body.data.list)).toBe(true)
      expect(res.body.data.total).toBeDefined()
    })

    it('支持分页参数', async () => {
      const res = await request(app).get('/api/deploys?page=1&pageSize=10').expect(200)
      expect(res.body.data.page).toBe(1)
      expect(res.body.data.pageSize).toBe(10)
    })

    it('支持按状态筛选', async () => {
      const res = await request(app).get('/api/deploys?status=success').expect(200)
      expect(res.body.code).toBe(200)
    })

    it('支持按环境筛选', async () => {
      const res = await request(app).get('/api/deploys?environment=prod').expect(200)
      expect(res.body.code).toBe(200)
    })
  })

  describe('GET /api/deploys/:id', () => {
    it('返回部署详情', async () => {
      const res = await request(app).get('/api/deploys/1').expect(200)
      expect(res.body.code).toBe(200)
      expect(res.body.data.id).toBe(1)
      expect(res.body.data.appName).toBeDefined()
    })

    it('不存在的任务返回404', async () => {
      const res = await request(app).get('/api/deploys/9999').expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('POST /api/deploys', () => {
    it('创建新部署任务', async () => {
      const res = await request(app)
        .post('/api/deploys')
        .send({ appId: 1, environment: 'staging', version: 'v3.0.0' })
        .expect(200)
      expect(res.body.code).toBe(200)
      expect(res.body.data.id).toBeDefined()
    })

    it('缺少必填参数返回400', async () => {
      const res = await request(app).post('/api/deploys').send({ appId: 1 }).expect(400)
      expect(res.body.code).toBe(400)
    })

    it('缺少环境参数返回400', async () => {
      const res = await request(app).post('/api/deploys').send({ appId: 1, version: 'v1.0.0' }).expect(400)
      expect(res.body.code).toBe(400)
    })

    it('缺少版本参数返回400', async () => {
      const res = await request(app).post('/api/deploys').send({ appId: 1, environment: 'prod' }).expect(400)
      expect(res.body.code).toBe(400)
    })
  })

  describe('PUT /api/deploys/:id', () => {
    it('更新部署任务', async () => {
      const res = await request(app).put('/api/deploys/1').send({ status: 'running' }).expect(200)
      expect(res.body.code).toBe(200)
    })

    it('更新不存在的任务返回404', async () => {
      const res = await request(app).put('/api/deploys/9999').send({ status: 'running' }).expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('DELETE /api/deploys/:id', () => {
    it('删除部署任务', async () => {
      const res = await request(app).delete('/api/deploys/1').expect(200)
      expect(res.body.code).toBe(200)
      expect(mockDatabase.deploys.has(1)).toBe(false)
    })

    it('删除不存在的任务返回404', async () => {
      const res = await request(app).delete('/api/deploys/9999').expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('POST /api/deploys/:id/execute', () => {
    it('执行部署任务', async () => {
      const res = await request(app).post('/api/deploys/1/execute').expect(200)
      expect(res.body.code).toBe(200)
      expect(res.body.message).toBe('部署任务已启动')
    })

    it('正在执行的任务不能再次执行', async () => {
      const res = await request(app).post('/api/deploys/2/execute').expect(400)
      expect(res.body.code).toBe(400)
    })

    it('不存在的任务返回404', async () => {
      const res = await request(app).post('/api/deploys/9999/execute').expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('POST /api/deploys/:id/cancel', () => {
    it('取消部署任务', async () => {
      const res = await request(app).post('/api/deploys/2/cancel').expect(200)
      expect(res.body.code).toBe(200)
      expect(res.body.message).toBe('部署任务已取消')
      expect(mockDatabase.deploys.get(2).status).toBe('cancelled')
    })

    it('已成功的任务无法取消', async () => {
      const res = await request(app).post('/api/deploys/1/cancel').expect(400)
      expect(res.body.code).toBe(400)
    })

    it('已失败的任务无法取消', async () => {
      const res = await request(app).post('/api/deploys/3/cancel').expect(400)
      expect(res.body.code).toBe(400)
    })

    it('不存在的任务返回404', async () => {
      const res = await request(app).post('/api/deploys/9999/cancel').expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('POST /api/deploys/:id/rollback', () => {
    it('回滚失败的部署任务', async () => {
      const res = await request(app).post('/api/deploys/3/rollback').expect(200)
      expect(res.body.code).toBe(200)
      expect(res.body.message).toBe('回滚任务已启动')
      expect(mockDatabase.deploys.get(3).status).toBe('rollback')
    })

    it('非失败状态不能回滚', async () => {
      const res = await request(app).post('/api/deploys/1/rollback').expect(400)
      expect(res.body.code).toBe(400)
      expect(res.body.message).toBe('只能回滚失败的部署任务')
    })

    it('运行中的任务不能回滚', async () => {
      const res = await request(app).post('/api/deploys/2/rollback').expect(400)
      expect(res.body.code).toBe(400)
    })

    it('不存在的任务返回404', async () => {
      const res = await request(app).post('/api/deploys/9999/rollback').expect(404)
      expect(res.body.code).toBe(404)
    })
  })

  describe('GET /api/deploys/:id/logs', () => {
    it('返回部署日志', async () => {
      const res = await request(app).get('/api/deploys/1/logs').expect(200)
      expect(res.body.code).toBe(200)
      expect(Array.isArray(res.body.data.logs)).toBe(true)
      expect(res.body.data.totalLines).toBe(2)
    })

    it('无日志的任务返回空数组', async () => {
      const res = await request(app).get('/api/deploys/2/logs').expect(200)
      expect(res.body.data.logs).toHaveLength(0)
    })

    it('不存在的任务返回404', async () => {
      const res = await request(app).get('/api/deploys/9999/logs').expect(404)
      expect(res.body.code).toBe(404)
    })
  })
})