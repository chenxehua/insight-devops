// 备份管理API集成测试
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  return app
}

const mockDb = {
  databases: new Map(),
  backups: new Map(),
}

// 数据库路由
const createDatabaseRoutes = () => {
  const router = express.Router()
  
  router.get('/databases', (req, res) => {
    const dbs = Array.from(mockDb.databases.values())
    res.json({
      code: 200, message: 'success',
      data: { list: dbs.slice(0, 20), total: dbs.length, page: 1, pageSize: 20 }
    })
  })
  
  router.post('/databases', (req, res) => {
    const { dbName, dbType, host, port } = req.body
    if (!dbName || !dbType || !host || !port) {
      return res.status(400).json({ code: 400, message: '数据库名称、类型、主机和端口不能为空' })
    }
    const id = Date.now()
    const db = { id, dbName, dbType, host, port, status: 1 }
    mockDb.databases.set(id, db)
    res.json({ code: 200, message: '创建成功', data: { id } })
  })
  
  router.delete('/databases/:id', (req, res) => {
    const id = parseInt(req.params.id)
    if (!mockDb.databases.has(id)) {
      return res.status(404).json({ code: 404, message: '数据库不存在' })
    }
    mockDb.databases.delete(id)
    res.json({ code: 200, message: '删除成功' })
  })
  
  return router
}

// 备份路由
const createBackupRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const backups = Array.from(mockDb.backups.values())
    res.json({
      code: 200, message: 'success',
      data: { list: backups.slice(0, 20), total: backups.length, page: 1, pageSize: 20 }
    })
  })
  
  router.get('/:id', (req, res) => {
    const backup = mockDb.backups.get(parseInt(req.params.id))
    if (!backup) {
      return res.status(404).json({ code: 404, message: '备份记录不存在' })
    }
    res.json({ code: 200, message: 'success', data: backup })
  })
  
  router.post('/', (req, res) => {
    const { databaseId, backupType } = req.body
    if (!databaseId || !backupType) {
      return res.status(400).json({ code: 400, message: '数据库ID和备份类型不能为空' })
    }
    if (!mockDb.databases.has(databaseId)) {
      return res.status(404).json({ code: 404, message: '数据库不存在' })
    }
    const id = Date.now()
    const backup = { id, databaseId, backupType, status: 'pending' }
    mockDb.backups.set(id, backup)
    res.json({ code: 200, message: '备份任务已创建', data: { id } })
  })
  
  router.post('/:id/restore', (req, res) => {
    const backup = mockDb.backups.get(parseInt(req.params.id))
    if (!backup) {
      return res.status(404).json({ code: 404, message: '备份记录不存在' })
    }
    if (backup.status !== 'success') {
      return res.status(400).json({ code: 400, message: '只能恢复成功的备份' })
    }
    if (!backup.backupPath) {
      return res.status(400).json({ code: 400, message: '备份文件路径不存在' })
    }
    const restoreId = Date.now() + 1
    res.json({
      code: 200, message: '恢复任务已启动',
      data: { restoreId, databaseName: 'Test DB', backupPath: backup.backupPath }
    })
  })
  
  return router
}

describe('备份管理 API 测试', () => {
  const app = createTestApp()
  app.use('/api/backups', createDatabaseRoutes())
  app.use('/api/backups', createBackupRoutes())
  
  beforeEach(() => {
    mockDb.databases.clear()
    mockDb.backups.clear()
    mockDb.databases.set(1, { id: 1, dbName: 'Test DB', dbType: 'mysql', host: 'localhost', port: 3306 })
    mockDb.backups.set(1, { id: 1, databaseId: 1, dbName: 'Test DB', backupType: 'full', status: 'success', backupPath: '/backup/test.db' })
  })
  
  describe('数据库管理', () => {
    describe('GET /api/backups/databases', () => {
      it('应该返回数据库列表', async () => {
        const response = await request(app).get('/api/backups/databases').expect(200)
        expect(response.body.code).toBe(200)
        expect(Array.isArray(response.body.data.list)).toBe(true)
      })
    })
    
    describe('POST /api/backups/databases', () => {
      it('应该创建数据库', async () => {
        const response = await request(app)
          .post('/api/backups/databases')
          .send({ dbName: 'New DB', dbType: 'mysql', host: 'localhost', port: 3306 })
          .expect(200)
        expect(response.body.code).toBe(200)
      })
      
      it('缺少必填参数应返回400', async () => {
        const response = await request(app)
          .post('/api/backups/databases')
          .send({ dbName: 'Test' })
          .expect(400)
        expect(response.body.code).toBe(400)
      })
    })
    
    describe('DELETE /api/backups/databases/:id', () => {
      it('应该删除数据库', async () => {
        const response = await request(app).delete('/api/backups/databases/1').expect(200)
        expect(response.body.code).toBe(200)
        expect(mockDb.databases.has(1)).toBe(false)
      })
    })
  })
  
  describe('备份管理', () => {
    describe('GET /api/backups', () => {
      it('应该返回备份列表', async () => {
        const response = await request(app).get('/api/backups').expect(200)
        expect(response.body.code).toBe(200)
      })
    })
    
    describe('POST /api/backups', () => {
      it('应该创建备份任务', async () => {
        const response = await request(app)
          .post('/api/backups')
          .send({ databaseId: 1, backupType: 'full' })
          .expect(200)
        expect(response.body.code).toBe(200)
      })
      
      it('数据库不存在应返回404', async () => {
        const response = await request(app)
          .post('/api/backups')
          .send({ databaseId: 9999, backupType: 'full' })
          .expect(404)
        expect(response.body.code).toBe(404)
      })
    })
    
    describe('POST /api/backups/:id/restore', () => {
      it('应该恢复备份', async () => {
        const response = await request(app)
          .post('/api/backups/1/restore')
          .expect(200)
        expect(response.body.code).toBe(200)
        expect(response.body.data.restoreId).toBeDefined()
      })
      
      it('未完成的备份不能恢复', async () => {
        mockDb.backups.get(1).status = 'running'
        const response = await request(app)
          .post('/api/backups/1/restore')
          .expect(400)
        expect(response.body.code).toBe(400)
      })
    })
  })
})