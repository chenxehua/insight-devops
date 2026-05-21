// 角色管理API集成测试
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  return app
}

const mockDb = {
  roles: new Map(),
  permissions: new Map(),
}

const createRoleRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const roles = Array.from(mockDb.roles.values())
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: roles.slice((page - 1) * pageSize, page * pageSize),
        total: roles.length,
        page,
        pageSize,
        totalPages: Math.ceil(roles.length / pageSize)
      }
    })
  })
  
  router.get('/:id', (req, res) => {
    const role = mockDb.roles.get(parseInt(req.params.id))
    if (!role) {
      return res.status(404).json({ code: 404, message: '角色不存在' })
    }
    res.json({ code: 200, message: 'success', data: role })
  })
  
  router.post('/', (req, res) => {
    const { name, code, description } = req.body
    if (!name || !code) {
      return res.status(400).json({ code: 400, message: '角色名称和代码不能为空' })
    }
    const id = Date.now()
    const role = { id, name, code, description, status: 1 }
    mockDb.roles.set(id, role)
    res.json({ code: 200, message: '创建成功', data: { id } })
  })
  
  router.put('/:id', (req, res) => {
    const role = mockDb.roles.get(parseInt(req.params.id))
    if (!role) {
      return res.status(404).json({ code: 404, message: '角色不存在' })
    }
    res.json({ code: 200, message: '更新成功' })
  })
  
  router.delete('/:id', (req, res) => {
    if (!mockDb.roles.has(parseInt(req.params.id))) {
      return res.status(404).json({ code: 404, message: '角色不存在' })
    }
    mockDb.roles.delete(parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  })
  
  // 分配权限
  router.post('/:id/permissions', (req, res) => {
    const role = mockDb.roles.get(parseInt(req.params.id))
    if (!role) {
      return res.status(404).json({ code: 404, message: '角色不存在' })
    }
    const { permissions } = req.body
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ code: 400, message: '权限列表格式错误' })
    }
    res.json({ code: 200, message: '权限分配成功' })
  })
  
  return router
}

const createPermissionRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const permissions = Array.from(mockDb.permissions.values())
    res.json({ code: 200, message: 'success', data: permissions })
  })
  
  return router
}

describe('角色管理 API 测试', () => {
  let app: express.Application
  
  beforeAll(() => {
    app = createTestApp()
    app.use('/api/roles', createRoleRoutes())
    app.use('/api/permissions', createPermissionRoutes())
  })
  
  beforeEach(() => {
    mockDb.roles.clear()
    mockDb.permissions.clear()
    mockDb.roles.set(1, {
      id: 1, name: 'Admin', code: 'admin', description: 'Administrator role', status: 1
    })
    mockDb.permissions.set(1, {
      id: 1, name: 'User Management', code: 'user:manage', type: 'menu'
    })
  })
  
  describe('角色管理', () => {
    describe('GET /api/roles', () => {
      it('应该返回角色列表', async () => {
        const response = await request(app)
          .get('/api/roles')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.list).toBeDefined()
      })
      
      it('应该支持分页参数', async () => {
        const response = await request(app)
          .get('/api/roles?page=1&pageSize=10')
          .expect(200)
        
        expect(response.body.data.page).toBe(1)
      })
    })
    
    describe('GET /api/roles/:id', () => {
      it('应该返回角色详情', async () => {
        const response = await request(app)
          .get('/api/roles/1')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(response.body.data.id).toBe(1)
      })
      
      it('角色不存在应返回404', async () => {
        const response = await request(app)
          .get('/api/roles/9999')
          .expect(404)
        
        expect(response.body.code).toBe(404)
      })
    })
    
    describe('POST /api/roles', () => {
      it('应该创建新角色', async () => {
        const response = await request(app)
          .post('/api/roles')
          .send({ name: 'Editor', code: 'editor', description: 'Editor role' })
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
      
      it('缺少必填参数应返回400', async () => {
        const response = await request(app)
          .post('/api/roles')
          .send({ name: 'Editor' })
          .expect(400)
        
        expect(response.body.code).toBe(400)
      })
    })
    
    describe('PUT /api/roles/:id', () => {
      it('应该更新角色', async () => {
        const response = await request(app)
          .put('/api/roles/1')
          .send({ description: 'Updated description' })
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
    })
    
    describe('DELETE /api/roles/:id', () => {
      it('应该删除角色', async () => {
        const response = await request(app)
          .delete('/api/roles/1')
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
    })
    
    describe('POST /api/roles/:id/permissions', () => {
      it('应该分配权限', async () => {
        const response = await request(app)
          .post('/api/roles/1/permissions')
          .send({ permissions: [1, 2, 3] })
          .expect(200)
        
        expect(response.body.code).toBe(200)
      })
      
      it('权限列表格式错误应返回400', async () => {
        const response = await request(app)
          .post('/api/roles/1/permissions')
          .send({ permissions: 'invalid' })
          .expect(400)
        
        expect(response.body.code).toBe(400)
      })
    })
  })
  
  describe('权限管理', () => {
    describe('GET /api/permissions', () => {
      it('应该返回权限列表', async () => {
        const response = await request(app)
          .get('/api/permissions')
          .expect(200)
        
        expect(response.body.code).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
      })
    })
  })
})