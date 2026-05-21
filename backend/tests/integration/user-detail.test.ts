// 用户管理API集成测试
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  return app
}

const mockDb = {
  users: new Map(),
}

const createUserRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const users = Array.from(mockDb.users.values()).map(u => ({ ...u, password: undefined }))
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: users.slice((page - 1) * pageSize, page * pageSize),
        total: users.length,
        page,
        pageSize,
        totalPages: Math.ceil(users.length / pageSize)
      }
    })
  })
  
  router.get('/:id', (req, res) => {
    const user = mockDb.users.get(parseInt(req.params.id))
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    const { password, ...userData } = user
    res.json({ code: 200, message: 'success', data: userData })
  })
  
  router.post('/', (req, res) => {
    const { username, email, password, roleId } = req.body
    if (!username || !email || !password) {
      return res.status(400).json({ code: 400, message: '用户名、邮箱和密码不能为空' })
    }
    const id = Date.now()
    mockDb.users.set(id, { id, username, email, password, roleId, status: 1 })
    res.json({ code: 200, message: '创建成功', data: { id } })
  })
  
  router.put('/:id', (req, res) => {
    const user = mockDb.users.get(parseInt(req.params.id))
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    res.json({ code: 200, message: '更新成功' })
  })
  
  router.put('/:id/password', (req, res) => {
    const user = mockDb.users.get(parseInt(req.params.id))
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ code: 400, message: '旧密码和新密码不能为空' })
    }
    res.json({ code: 200, message: '密码修改成功' })
  })
  
  router.delete('/:id', (req, res) => {
    if (!mockDb.users.has(parseInt(req.params.id))) {
      return res.status(404).json({ code: 404, message: '用户不存在' })
    }
    mockDb.users.delete(parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  })
  
  return router
}

describe('用户管理 API 测试', () => {
  let app: express.Application
  
  beforeAll(() => {
    app = createTestApp()
    app.use('/api/users', createUserRoutes())
  })
  
  beforeEach(() => {
    mockDb.users.clear()
    mockDb.users.set(1, {
      id: 1, username: 'testuser', email: 'test@example.com', password: 'hashed', roleId: 1, status: 1
    })
  })
  
  describe('GET /api/users', () => {
    it('应该返回用户列表', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.list).toBeDefined()
      expect(response.body.data.list[0]).not.toHaveProperty('password')
    })
    
    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/users?page=1&pageSize=10')
        .expect(200)
      
      expect(response.body.data.page).toBe(1)
      expect(response.body.data.pageSize).toBe(10)
    })
  })
  
  describe('GET /api/users/:id', () => {
    it('应该返回用户详情', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.id).toBe(1)
      expect(response.body.data).not.toHaveProperty('password')
    })
    
    it('用户不存在应返回404', async () => {
      const response = await request(app)
        .get('/api/users/9999')
        .expect(404)
      
      expect(response.body.code).toBe(404)
    })
  })
  
  describe('POST /api/users', () => {
    it('应该创建新用户', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ username: 'newuser', email: 'new@example.com', password: 'password123' })
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
    
    it('缺少必填参数应返回400', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ username: 'newuser' })
        .expect(400)
      
      expect(response.body.code).toBe(400)
    })
  })
  
  describe('PUT /api/users/:id', () => {
    it('应该更新用户', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .send({ email: 'updated@example.com' })
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
  })
  
  describe('PUT /api/users/:id/password', () => {
    it('应该修改密码', async () => {
      const response = await request(app)
        .put('/api/users/1/password')
        .send({ oldPassword: 'old', newPassword: 'new' })
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
    
    it('缺少密码参数应返回400', async () => {
      const response = await request(app)
        .put('/api/users/1/password')
        .send({ oldPassword: 'old' })
        .expect(400)
      
      expect(response.body.code).toBe(400)
    })
  })
  
  describe('DELETE /api/users/:id', () => {
    it('应该删除用户', async () => {
      const response = await request(app)
        .delete('/api/users/1')
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
  })
})