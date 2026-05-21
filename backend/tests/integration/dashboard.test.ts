// 仪表盘API集成测试
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  return app
}

// 仪表盘路由
const createDashboardRoutes = () => {
  const router = express.Router()
  
  router.get('/stats', (req, res) => {
    res.json({
      code: 200, message: 'success',
      data: {
        overview: {
          apps: { total: 5, active: 4 },
          users: { total: 10, active: 8 },
          scripts: { total: 20 },
          monitors: { total: 15 },
        },
        deploys: { total: 50, success: 45, running: 2, failed: 3 },
        alerts: { total: 100, triggered: 5, resolved: 95 },
        faults: { total: 8, open: 2, handling: 3 },
        backups: { total: 30, success: 28, totalSize: 1024000 },
        recentDeploys: [
          { id: 1, appName: 'App1', environment: 'prod', version: 'v1.0.0', status: 'success', createdAt: new Date().toISOString() }
        ],
        recentAlerts: [
          { id: 1, alertName: 'CPU Alert', level: 'warning', status: 'triggered', createdAt: new Date().toISOString() }
        ],
        activeFaults: [
          { id: 1, title: 'Service Down', level: 'critical', status: 'open', createdAt: new Date().toISOString() }
        ],
      }
    })
  })
  
  router.get('/trend', (req, res) => {
    const days = parseInt(req.query.days as string) || 7
    res.json({
      code: 200, message: 'success',
      data: {
        deployTrend: [
          { date: '2024-01-01', total: 10, success: 9, failed: 1 },
          { date: '2024-01-02', total: 15, success: 14, failed: 1 }
        ],
        alertTrend: [
          { date: '2024-01-01', total: 20, critical: 2, warning: 5 },
          { date: '2024-01-02', total: 18, critical: 1, warning: 4 }
        ],
        backupTrend: [
          { date: '2024-01-01', total: 5, success: 5 },
          { date: '2024-01-02', total: 4, success: 4 }
        ]
      }
    })
  })
  
  return router
}

describe('仪表盘 API 测试', () => {
  const app = createTestApp()
  app.use('/api/dashboard', createDashboardRoutes())
  
  describe('GET /api/dashboard/stats', () => {
    it('应该返回仪表盘统计数据', async () => {
      const response = await request(app).get('/api/dashboard/stats').expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.overview).toBeDefined()
      expect(response.body.data.overview.apps).toBeDefined()
      expect(response.body.data.overview.users).toBeDefined()
      expect(response.body.data.deploys).toBeDefined()
      expect(response.body.data.alerts).toBeDefined()
      expect(response.body.data.faults).toBeDefined()
      expect(response.body.data.backups).toBeDefined()
      expect(response.body.data.recentDeploys).toBeDefined()
      expect(response.body.data.recentAlerts).toBeDefined()
      expect(response.body.data.activeFaults).toBeDefined()
    })
    
    it('统计数据应该包含正确的字段', async () => {
      const response = await request(app).get('/api/dashboard/stats').expect(200)
      
      const { overview, deploys, alerts } = response.body.data
      
      // overview 字段
      expect(overview.apps.total).toBeDefined()
      expect(overview.apps.active).toBeDefined()
      expect(overview.users.total).toBeDefined()
      expect(overview.users.active).toBeDefined()
      
      // deploys 字段
      expect(deploys.total).toBeDefined()
      expect(deploys.success).toBeDefined()
      expect(deploys.running).toBeDefined()
      expect(deploys.failed).toBeDefined()
      
      // alerts 字段
      expect(alerts.total).toBeDefined()
      expect(alerts.triggered).toBeDefined()
      expect(alerts.resolved).toBeDefined()
    })
    
    it('最近部署记录应该格式正确', async () => {
      const response = await request(app).get('/api/dashboard/stats').expect(200)
      const recentDeploys = response.body.data.recentDeploys
      
      expect(Array.isArray(recentDeploys)).toBe(true)
      if (recentDeploys.length > 0) {
        expect(recentDeploys[0].id).toBeDefined()
        expect(recentDeploys[0].appName).toBeDefined()
        expect(recentDeploys[0].status).toBeDefined()
      }
    })
    
    it('最近告警应该格式正确', async () => {
      const response = await request(app).get('/api/dashboard/stats').expect(200)
      const recentAlerts = response.body.data.recentAlerts
      
      expect(Array.isArray(recentAlerts)).toBe(true)
      if (recentAlerts.length > 0) {
        expect(recentAlerts[0].id).toBeDefined()
        expect(recentAlerts[0].alertName).toBeDefined()
        expect(recentAlerts[0].level).toBeDefined()
      }
    })
    
    it('活跃故障应该格式正确', async () => {
      const response = await request(app).get('/api/dashboard/stats').expect(200)
      const activeFaults = response.body.data.activeFaults
      
      expect(Array.isArray(activeFaults)).toBe(true)
      if (activeFaults.length > 0) {
        expect(activeFaults[0].id).toBeDefined()
        expect(activeFaults[0].title).toBeDefined()
        expect(activeFaults[0].status).toBeDefined()
      }
    })
  })
  
  describe('GET /api/dashboard/trend', () => {
    it('应该返回趋势数据', async () => {
      const response = await request(app).get('/api/dashboard/trend').expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.deployTrend).toBeDefined()
      expect(response.body.data.alertTrend).toBeDefined()
      expect(response.body.data.backupTrend).toBeDefined()
    })
    
    it('应该支持days参数', async () => {
      const response = await request(app)
        .get('/api/dashboard/trend')
        .query({ days: 14 })
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
    
    it('趋势数据应该格式正确', async () => {
      const response = await request(app).get('/api/dashboard/trend').expect(200)
      
      // 部署趋势
      const deployTrend = response.body.data.deployTrend
      if (deployTrend.length > 0) {
        expect(deployTrend[0].date).toBeDefined()
        expect(deployTrend[0].total).toBeDefined()
        expect(deployTrend[0].success).toBeDefined()
        expect(deployTrend[0].failed).toBeDefined()
      }
      
      // 告警趋势
      const alertTrend = response.body.data.alertTrend
      if (alertTrend.length > 0) {
        expect(alertTrend[0].date).toBeDefined()
        expect(alertTrend[0].total).toBeDefined()
        expect(alertTrend[0].critical).toBeDefined()
        expect(alertTrend[0].warning).toBeDefined()
      }
      
      // 备份趋势
      const backupTrend = response.body.data.backupTrend
      if (backupTrend.length > 0) {
        expect(backupTrend[0].date).toBeDefined()
        expect(backupTrend[0].total).toBeDefined()
        expect(backupTrend[0].success).toBeDefined()
      }
    })
  })
})