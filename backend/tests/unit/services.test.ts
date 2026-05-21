// Services 单元测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  initDatabase, 
  closeDatabase, 
  resetDatabase,
  runQuery,
  getOne,
  getAll,
  getLastInsertRowId
} from '@/lib/database'

describe('Services Unit Tests', () => {
  beforeEach(async () => {
    await initDatabase()
  })

  afterEach(async () => {
    await resetDatabase()
    await closeDatabase()
  })

  describe('User Service', () => {
    it('应该创建用户', async () => {
      const { createUser } = await import('@/lib/services/user')
      
      const user = await createUser({
        username: 'newuser',
        password: 'password123',
        email: 'new@example.com',
        phone: '13800000000',
        realName: 'New User',
      })
      
      expect(user).toHaveProperty('id')
      expect(user.username).toBe('newuser')
    })

    it('应该验证用户存在', async () => {
      const { validateUser } = await import('@/lib/services/user')
      
      const result = await validateUser('admin', 'admin123')
      expect(result).toBeTruthy()
    })

    it('错误密码应该返回null', async () => {
      const { validateUser } = await import('@/lib/services/user')
      
      const result = await validateUser('admin', 'wrongpassword')
      expect(result).toBeNull()
    })

    it('不存在的用户应该返回null', async () => {
      const { validateUser } = await import('@/lib/services/user')
      
      const result = await validateUser('nonexistent', 'password')
      expect(result).toBeNull()
    })

    it('应该获取用户列表', async () => {
      const { listUsers } = await import('@/lib/services/user')
      
      const users = await listUsers()
      expect(Array.isArray(users)).toBe(true)
      expect(users.length).toBeGreaterThan(0)
    })

    it('应该更新用户', async () => {
      const { updateUser } = await import('@/lib/services/user')
      
      const result = await updateUser(1, {
        realName: 'Updated Name',
      })
      
      expect(result).toBeTruthy()
    })

    it('应该删除用户', async () => {
      const { deleteUser } = await import('@/lib/services/user')
      
      const result = await deleteUser(1)
      expect(result).toBeTruthy()
    })
  })

  describe('App Service', () => {
    it('应该创建应用', async () => {
      const { createApp } = await import('@/lib/services/app')
      
      const app = await createApp({
        appName: 'Test App',
        appCode: 'TEST_APP',
        description: 'Test description',
      })
      
      expect(app).toHaveProperty('id')
      expect(app.appName).toBe('Test App')
    })

    it('应该获取应用列表', async () => {
      const { listApps } = await import('@/lib/services/app')
      
      const apps = await listApps()
      expect(Array.isArray(apps)).toBe(true)
    })

    it('应该获取单个应用', async () => {
      const { getApp } = await import('@/lib/services/app')
      
      const app = await getApp(1)
      expect(app).toHaveProperty('id')
      expect(app).toHaveProperty('appName')
    })

    it('不存在的应用应该返回null', async () => {
      const { getApp } = await import('@/lib/services/app')
      
      const app = await getApp(9999)
      expect(app).toBeNull()
    })
  })

  describe('Auth Service', () => {
    it('应该验证密码', async () => {
      const { verifyPassword } = await import('@/lib/services/auth')
      
      const result = await verifyPassword('admin123', 'admin123')
      expect(result).toBe(true)
    })

    it('错误密码应该返回false', async () => {
      const { verifyPassword } = await import('@/lib/services/auth')
      
      const result = await verifyPassword('admin123', 'wrong')
      expect(result).toBe(false)
    })

    it('应该生成token', async () => {
      const { generateToken } = await import('@/lib/services/auth')
      
      const token = await generateToken({ id: 1, username: 'admin' })
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
    })

    it('应该验证token', async () => {
      const { generateToken, verifyToken } = await import('@/lib/services/auth')
      
      const token = await generateToken({ id: 1, username: 'admin' })
      const payload = await verifyToken(token)
      
      expect(payload).toHaveProperty('id')
      expect(payload.username).toBe('admin')
    })

    it('无效token应该返回null', async () => {
      const { verifyToken } = await import('@/lib/services/auth')
      
      const payload = await verifyToken('invalid-token')
      expect(payload).toBeNull()
    })

    it('应该哈希密码', async () => {
      const { hashPassword } = await import('@/lib/services/auth')
      
      const hash = await hashPassword('password')
      expect(hash).toBeTruthy()
      expect(hash).not.toBe('password')
    })
  })
})