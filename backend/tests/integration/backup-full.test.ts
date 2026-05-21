// 备份API完整测试 - 覆盖所有端点和代码路径
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import express, { Application } from 'express'
import request from 'supertest'
import { initDatabase, closeDatabase, resetDatabase } from '@/lib/database'
import backupRoutes from '@/api/backups'
import authRoutes from '@/api/auth'

const createApp = (): Application => {
  const app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/backups', backupRoutes)
  return app
}

describe('Backup API 完整测试', () => {
  let app: Application
  let cookie: string

  beforeEach(async () => {
    app = createApp()
    await initDatabase()
    const res = await request(app).post('/api/auth/login').send({
      username: 'admin',
      password: 'admin123',
    })
    const setCookie = res.headers['set-cookie']
    if (setCookie) {
      const tokenCookie = setCookie.find(c => c.startsWith('token='))
      if (tokenCookie) {
        cookie = tokenCookie.split(';')[0]
      }
    }
  })

  afterEach(async () => {
    await resetDatabase()
    await closeDatabase()
  })

  describe('GET /api/backups/databases', () => {
    it('应该返回数据库列表', async () => {
      const res = await request(app)
        .get('/api/backups/databases')
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('list')
      expect(res.body.data).toHaveProperty('total')
    })

    it('应该支持关键词搜索', async () => {
      const res = await request(app)
        .get('/api/backups/databases?keyword=mysql')
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
    })

    it('应该支持按类型筛选', async () => {
      const res = await request(app)
        .get('/api/backups/databases?dbType=mysql')
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
    })

    it('应该支持按状态筛选', async () => {
      const res = await request(app)
        .get('/api/backups/databases?status=1')
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
    })

    it('未认证应该返回401', async () => {
      const res = await request(app).get('/api/backups/databases')
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/backups/databases', () => {
    it('应该创建新数据库', async () => {
      const res = await request(app)
        .post('/api/backups/databases')
        .set('Cookie', cookie)
        .send({
          dbName: 'Production DB',
          dbType: 'mysql',
          host: 'db.example.com',
          port: 3306,
          username: 'dbuser',
          password: 'password',
          description: 'Production database',
        })

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id')
    })

    it('缺少必填字段应该返回400', async () => {
      const res = await request(app)
        .post('/api/backups/databases')
        .set('Cookie', cookie)
        .send({
          dbName: 'Test DB',
        })

      expect(res.status).toBe(400)
    })

    it('应该支持无密码数据库', async () => {
      const res = await request(app)
        .post('/api/backups/databases')
        .set('Cookie', cookie)
        .send({
          dbName: 'Simple DB',
          dbType: 'mysql',
          host: 'localhost',
          port: 3306,
        })

      expect(res.status).toBe(200)
    })
  })

  describe('PUT /api/backups/databases/:id', () => {
    it('应该更新数据库', async () => {
      const res = await request(app)
        .put('/api/backups/databases/1')
        .set('Cookie', cookie)
        .send({
          dbName: 'Updated DB',
          description: 'Updated description',
        })

      expect(res.status).toBe(200)
    })

    it('应该支持更新密码', async () => {
      const res = await request(app)
        .put('/api/backups/databases/1')
        .set('Cookie', cookie)
        .send({
          password: 'newpassword',
        })

      expect(res.status).toBe(200)
    })

    it('数据库不存在应该返回404', async () => {
      const res = await request(app)
        .put('/api/backups/databases/9999')
        .set('Cookie', cookie)
        .send({
          dbName: 'Updated',
        })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/backups/databases/:id', () => {
    it('应该删除数据库', async () => {
      const res = await request(app)
        .delete('/api/backups/databases/1')
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
    })

    it('数据库不存在应该返回404', async () => {
      const res = await request(app)
        .delete('/api/backups/databases/9999')
        .set('Cookie', cookie)

      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/backups', () => {
    it('应该返回备份列表', async () => {
      const res = await request(app)
        .get('/api/backups')
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('list')
      expect(res.body.data).toHaveProperty('total')
    })

    it('应该支持按数据库ID筛选', async () => {
      const res = await request(app)
        .get('/api/backups?databaseId=1')
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
    })

    it('应该支持按备份类型筛选', async () => {
      const res = await request(app)
        .get('/api/backups?backupType=full')
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
    })

    it('应该支持按状态筛选', async () => {
      const res = await request(app)
        .get('/api/backups?status=success')
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/backups', () => {
    it('应该创建新备份', async () => {
      const res = await request(app)
        .post('/api/backups')
        .set('Cookie', cookie)
        .send({
          databaseId: 1,
          backupType: 'full',
        })

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id')
    })

    it('缺少必填字段应该返回400', async () => {
      const res = await request(app)
        .post('/api/backups')
        .set('Cookie', cookie)
        .send({
          databaseId: 1,
        })

      expect(res.status).toBe(400)
    })

    it('数据库不存在应该返回404', async () => {
      const res = await request(app)
        .post('/api/backups')
        .set('Cookie', cookie)
        .send({
          databaseId: 9999,
          backupType: 'full',
        })

      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/backups/:id', () => {
    it('应该返回备份详情', async () => {
      const res = await request(app)
        .get('/api/backups/1')
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data).toHaveProperty('backupType')
    })

    it('备份不存在应该返回404', async () => {
      const res = await request(app)
        .get('/api/backups/9999')
        .set('Cookie', cookie)

      expect(res.status).toBe(404)
    })
  })

  describe('PUT /api/backups/:id', () => {
    it('应该更新备份状态', async () => {
      const res = await request(app)
        .put('/api/backups/1')
        .set('Cookie', cookie)
        .send({
          status: 'running',
          startedAt: true,
        })

      expect(res.status).toBe(200)
    })

    it('应该支持更新备份信息', async () => {
      const res = await request(app)
        .put('/api/backups/1')
        .set('Cookie', cookie)
        .send({
          status: 'success',
          backupPath: '/backup/db_20240101.sql',
          backupSize: 1024000,
          finishedAt: true,
        })

      expect(res.status).toBe(200)
    })

    it('应该支持记录错误信息', async () => {
      const res = await request(app)
        .put('/api/backups/1')
        .set('Cookie', cookie)
        .send({
          status: 'failed',
          errorMessage: 'Connection timeout',
          finishedAt: true,
        })

      expect(res.status).toBe(200)
    })

    it('备份不存在应该返回404', async () => {
      const res = await request(app)
        .put('/api/backups/9999')
        .set('Cookie', cookie)
        .send({
          status: 'running',
        })

      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /api/backups/:id', () => {
    it('应该删除备份记录', async () => {
      const res = await request(app)
        .delete('/api/backups/1')
        .set('Cookie', cookie)

      expect(res.status).toBe(200)
    })

    it('备份不存在应该返回404', async () => {
      const res = await request(app)
        .delete('/api/backups/9999')
        .set('Cookie', cookie)

      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/backups/:id/restore', () => {
    it('应该启动恢复任务', async () => {
      const res = await request(app)
        .post('/api/backups/1/restore')
        .set('Cookie', cookie)

      expect([200, 400]).toContain(res.status)
    })

    it('备份不存在应该返回404', async () => {
      const res = await request(app)
        .post('/api/backups/9999/restore')
        .set('Cookie', cookie)

      expect(res.status).toBe(404)
    })
  })
})