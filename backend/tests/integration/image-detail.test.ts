// 镜像管理API集成测试
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  return app
}

const mockDb = {
  images: new Map(),
}

const createImageRoutes = () => {
  const router = express.Router()
  
  router.get('/', (req, res) => {
    const images = Array.from(mockDb.images.values())
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    res.json({
      code: 200,
      message: 'success',
      data: {
        list: images.slice((page - 1) * pageSize, page * pageSize),
        total: images.length,
        page,
        pageSize,
        totalPages: Math.ceil(images.length / pageSize)
      }
    })
  })
  
  router.get('/:id', (req, res) => {
    const image = mockDb.images.get(parseInt(req.params.id))
    if (!image) {
      return res.status(404).json({ code: 404, message: '镜像不存在' })
    }
    res.json({ code: 200, message: 'success', data: image })
  })
  
  router.post('/', (req, res) => {
    const { name, tag, repository, size } = req.body
    if (!name || !tag) {
      return res.status(400).json({ code: 400, message: '镜像名称和标签不能为空' })
    }
    const id = Date.now()
    const image = { id, name, tag, repository, size, status: 1 }
    mockDb.images.set(id, image)
    res.json({ code: 200, message: '创建成功', data: { id } })
  })
  
  router.delete('/:id', (req, res) => {
    if (!mockDb.images.has(parseInt(req.params.id))) {
      return res.status(404).json({ code: 404, message: '镜像不存在' })
    }
    mockDb.images.delete(parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  })
  
  router.post('/:id/pull', (req, res) => {
    const image = mockDb.images.get(parseInt(req.params.id))
    if (!image) {
      return res.status(404).json({ code: 404, message: '镜像不存在' })
    }
    res.json({ code: 200, message: '拉取任务已启动' })
  })
  
  router.post('/:id/push', (req, res) => {
    const image = mockDb.images.get(parseInt(req.params.id))
    if (!image) {
      return res.status(404).json({ code: 404, message: '镜像不存在' })
    }
    res.json({ code: 200, message: '推送任务已启动' })
  })
  
  return router
}

describe('镜像管理 API 测试', () => {
  let app: express.Application
  
  beforeAll(() => {
    app = createTestApp()
    app.use('/api/images', createImageRoutes())
  })
  
  beforeEach(() => {
    mockDb.images.clear()
    mockDb.images.set(1, {
      id: 1, name: 'nginx', tag: 'latest', repository: 'docker.io', size: 142000000, status: 1
    })
  })
  
  describe('GET /api/images', () => {
    it('应该返回镜像列表', async () => {
      const response = await request(app)
        .get('/api/images')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.list).toBeDefined()
    })
    
    it('应该支持分页参数', async () => {
      const response = await request(app)
        .get('/api/images?page=1&pageSize=10')
        .expect(200)
      
      expect(response.body.data.page).toBe(1)
    })
  })
  
  describe('GET /api/images/:id', () => {
    it('应该返回镜像详情', async () => {
      const response = await request(app)
        .get('/api/images/1')
        .expect(200)
      
      expect(response.body.code).toBe(200)
      expect(response.body.data.id).toBe(1)
    })
    
    it('镜像不存在应返回404', async () => {
      const response = await request(app)
        .get('/api/images/9999')
        .expect(404)
      
      expect(response.body.code).toBe(404)
    })
  })
  
  describe('POST /api/images', () => {
    it('应该创建新镜像', async () => {
      const response = await request(app)
        .post('/api/images')
        .send({ name: 'redis', tag: '7.0' })
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
    
    it('缺少必填参数应返回400', async () => {
      const response = await request(app)
        .post('/api/images')
        .send({ name: 'redis' })
        .expect(400)
      
      expect(response.body.code).toBe(400)
    })
  })
  
  describe('DELETE /api/images/:id', () => {
    it('应该删除镜像', async () => {
      const response = await request(app)
        .delete('/api/images/1')
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
  })
  
  describe('POST /api/images/:id/pull', () => {
    it('应该拉取镜像', async () => {
      const response = await request(app)
        .post('/api/images/1/pull')
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
  })
  
  describe('POST /api/images/:id/push', () => {
    it('应该推送镜像', async () => {
      const response = await request(app)
        .post('/api/images/1/push')
        .expect(200)
      
      expect(response.body.code).toBe(200)
    })
  })
})