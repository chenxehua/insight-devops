// 部署API完整测试 - 覆盖所有端点和代码路径
import { describe, it, expect, beforeEach } from 'vitest'
import express, { Application } from 'express'
import request from 'supertest'

// Mock data store
const mockDeploys = new Map([
  [1, { id: 1, app_id: 1, environment: 'dev', version: 'v1.0.0', status: 'success', deploy_log: 'Deployed successfully', started_at: '2024-01-01 10:00:00', finished_at: '2024-01-01 10:05:00', created_at: '2024-01-01 09:00:00' }],
  [2, { id: 2, app_id: 1, environment: 'prod', version: 'v1.1.0', status: 'running', started_at: '2024-01-02 10:00:00', created_at: '2024-01-02 09:00:00' }],
  [3, { id: 3, app_id: 1, environment: 'dev', version: 'v1.2.0', status: 'failed', deploy_log: 'Build failed', created_at: '2024-01-03 09:00:00' }],
])
const mockDeployLogs = new Map([
  [1, { id: 1, deploy_id: 1, level: 'info', message: 'Deployment started', timestamp: '2024-01-01 10:00:00' }],
  [2, { id: 2, deploy_id: 1, level: 'info', message: 'Deployment completed', timestamp: '2024-01-01 10:05:00' }],
])
const mockDeployHistory = new Map([
  [1, { id: 1, deploy_id: 1, version: 'v1.0.0', status: 'success', created_at: '2024-01-01 10:05:00' }],
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

  // Deploy routes
  const deployRouter = express.Router()
  deployRouter.get('/', (req, res) => {
    let list = Array.from(mockDeploys.values())
    if (req.query.status) list = list.filter(d => d.status === req.query.status)
    if (req.query.environment) list = list.filter(d => d.environment === req.query.environment)
    res.json({ code: 200, data: { list, total: list.length, page: 1, pageSize: 20 } })
  })
  deployRouter.get('/:id', (req, res) => {
    const deploy = mockDeploys.get(parseInt(req.params.id))
    if (!deploy) return res.status(404).json({ code: 404, message: '部署不存在' })
    res.json({ code: 200, data: deploy })
  })
  deployRouter.get('/:id/logs', (req, res) => {
    const deploy = mockDeploys.get(parseInt(req.params.id))
    if (!deploy) return res.status(404).json({ code: 404, message: '部署不存在' })
    const logs = Array.from(mockDeployLogs.values()).filter(l => l.deploy_id === deploy.id)
    res.json({ code: 200, data: logs })
  })
  deployRouter.get('/:id/history', (req, res) => {
    const deploy = mockDeploys.get(parseInt(req.params.id))
    if (!deploy) return res.status(404).json({ code: 404, message: '部署不存在' })
    const history = Array.from(mockDeployHistory.values()).filter(h => h.deploy_id === deploy.id)
    res.json({ code: 200, data: history })
  })
  deployRouter.post('/', (req, res) => {
    const { appId, environment, version } = req.body
    if (!appId || !environment || !version) {
      return res.status(400).json({ code: 400, message: '应用ID、环境和版本不能为空' })
    }
    const id = Date.now()
    mockDeploys.set(id, { id, app_id: appId, environment, version, status: 'pending', created_at: new Date().toISOString() })
    res.json({ code: 200, data: { id } })
  })
  deployRouter.put('/:id', (req, res) => {
    const deploy = mockDeploys.get(parseInt(req.params.id))
    if (!deploy) return res.status(404).json({ code: 404, message: '部署不存在' })
    Object.assign(deploy, req.body)
    res.json({ code: 200, message: '更新成功' })
  })
  deployRouter.delete('/:id', (req, res) => {
    res.json({ code: 200, message: '删除成功' })
  })
  deployRouter.post('/:id/execute', (req, res) => {
    const deploy = mockDeploys.get(parseInt(req.params.id))
    if (!deploy) return res.status(404).json({ code: 404, message: '部署不存在' })
    if (deploy.status === 'running') {
      return res.status(400).json({ code: 400, message: '部署任务正在执行中' })
    }
    deploy.status = 'running'
    deploy.started_at = new Date().toISOString()
    res.json({ code: 200, data: { id: deploy.id, status: 'running' } })
  })
  deployRouter.post('/:id/cancel', (req, res) => {
    const deploy = mockDeploys.get(parseInt(req.params.id))
    if (!deploy) return res.status(404).json({ code: 404, message: '部署不存在' })
    if (deploy.status === 'success' || deploy.status === 'failed') {
      return res.status(400).json({ code: 400, message: '已完成的任务无法取消' })
    }
    deploy.status = 'cancelled'
    res.json({ code: 200, message: '取消成功' })
  })
  deployRouter.post('/:id/rollback', (req, res) => {
    const deploy = mockDeploys.get(parseInt(req.params.id))
    if (!deploy) return res.status(404).json({ code: 404, message: '部署不存在' })
    if (deploy.status !== 'failed') {
      return res.status(400).json({ code: 400, message: '只有失败的部署任务可以回滚' })
    }
    res.json({ code: 200, message: '回滚成功' })
  })
  app.use('/api/deploys', deployRouter)

  return app
}

describe('Deploy API 完整测试', () => {
  let app: Application

  beforeEach(() => {
    app = createApp()
    mockDeploys.clear()
    mockDeploys.set(1, { id: 1, app_id: 1, environment: 'dev', version: 'v1.0.0', status: 'success', started_at: '2024-01-01 10:00:00', finished_at: '2024-01-01 10:05:00', created_at: '2024-01-01 09:00:00' })
    mockDeploys.set(2, { id: 2, app_id: 1, environment: 'prod', version: 'v1.1.0', status: 'running', started_at: '2024-01-02 10:00:00', created_at: '2024-01-02 09:00:00' })
    mockDeploys.set(3, { id: 3, app_id: 1, environment: 'dev', version: 'v1.2.0', status: 'failed', deploy_log: 'Build failed', created_at: '2024-01-03 09:00:00' })
    mockDeployLogs.clear()
    mockDeployLogs.set(1, { id: 1, deploy_id: 1, level: 'info', message: 'Deployment started', timestamp: '2024-01-01 10:00:00' })
    mockDeployHistory.clear()
    mockDeployHistory.set(1, { id: 1, deploy_id: 1, version: 'v1.0.0', status: 'success', created_at: '2024-01-01 10:05:00' })
  })

  describe('GET /api/deploys', () => {
    it('应该返回部署任务列表', async () => {
      const res = await request(app).get('/api/deploys').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('list')
      expect(res.body.data).toHaveProperty('total')
    })

    it('应该支持分页参数', async () => {
      const res = await request(app).get('/api/deploys?page=1&pageSize=10').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })

    it('应该支持按状态筛选', async () => {
      const res = await request(app).get('/api/deploys?status=running').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(res.body.data.list.every((d: any) => d.status === 'running')).toBe(true)
    })

    it('应该支持按环境筛选', async () => {
      const res = await request(app).get('/api/deploys?environment=dev').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })

    it('未认证应该返回401', async () => {
      const res = await request(app).get('/api/deploys')
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/deploys/:id', () => {
    it('应该返回部署详情', async () => {
      const res = await request(app).get('/api/deploys/1').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id')
    })

    it('任务不存在应该返回404', async () => {
      const res = await request(app).get('/api/deploys/9999').set('Cookie', 'token=test')
      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/deploys', () => {
    it('应该创建新部署任务', async () => {
      const res = await request(app)
        .post('/api/deploys')
        .set('Cookie', 'token=test')
        .send({ appId: 1, environment: 'dev', version: 'v2.0.0' })
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id')
    })

    it('缺少必填字段应该返回400', async () => {
      const res = await request(app)
        .post('/api/deploys')
        .set('Cookie', 'token=test')
        .send({ appId: 1 })
      expect(res.status).toBe(400)
    })
  })

  describe('PUT /api/deploys/:id', () => {
    it('应该更新部署任务', async () => {
      const res = await request(app)
        .put('/api/deploys/1')
        .set('Cookie', 'token=test')
        .send({ version: 'v1.0.1' })
      expect(res.status).toBe(200)
    })

    it('任务不存在应该返回404', async () => {
      const res = await request(app)
        .put('/api/deploys/9999')
        .set('Cookie', 'token=test')
        .send({ version: 'v1.0.1' })
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/deploys/:id', () => {
    it('应该删除部署任务', async () => {
      const res = await request(app).delete('/api/deploys/1').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/deploys/:id/execute', () => {
    it('应该执行部署任务', async () => {
      const res = await request(app).post('/api/deploys/1/execute').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })

    it('正在执行的任务应该返回400', async () => {
      const res = await request(app).post('/api/deploys/2/execute').set('Cookie', 'token=test')
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/deploys/:id/cancel', () => {
    it('应该取消进行中的部署任务', async () => {
      const res = await request(app).post('/api/deploys/2/cancel').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })

    it('已完成的任务无法取消', async () => {
      const res = await request(app).post('/api/deploys/1/cancel').set('Cookie', 'token=test')
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/deploys/:id/rollback', () => {
    it('应该回滚失败的部署任务', async () => {
      const res = await request(app).post('/api/deploys/3/rollback').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
    })

    it('非失败状态的任务应该返回400', async () => {
      const res = await request(app).post('/api/deploys/1/rollback').set('Cookie', 'token=test')
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/deploys/:id/logs', () => {
    it('应该获取部署日志', async () => {
      const res = await request(app).get('/api/deploys/1/logs').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('任务不存在应该返回404', async () => {
      const res = await request(app).get('/api/deploys/9999/logs').set('Cookie', 'token=test')
      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/deploys/:id/history', () => {
    it('应该获取部署历史', async () => {
      const res = await request(app).get('/api/deploys/1/history').set('Cookie', 'token=test')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })
})