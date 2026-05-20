// 认证工具单元测试
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { 
  generateToken, 
  verifyToken, 
  hashPassword, 
  verifyPassword,
  generateRandomString 
} from '../../app/lib/utils/auth'

describe('认证工具测试', () => {
  const testPayload = {
    userId: 1,
    username: 'testuser',
    email: 'test@example.com',
  }

  describe('generateToken & verifyToken', () => {
    it('应该正确生成和验证Token', () => {
      const token = generateToken(testPayload)
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      
      const payload = verifyToken(token)
      expect(payload).toBeTruthy()
      expect(payload?.userId).toBe(testPayload.userId)
      expect(payload?.username).toBe(testPayload.username)
      expect(payload?.email).toBe(testPayload.email)
    })

    it('应该拒绝无效Token', () => {
      const payload = verifyToken('invalid-token')
      expect(payload).toBeNull()
    })

    it('应该拒绝格式错误的Token', () => {
      const payload = verifyToken('not-a-jwt-token')
      expect(payload).toBeNull()
    })
  })

  describe('hashPassword & verifyPassword', () => {
    it('应该正确加密和验证密码', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      
      expect(hash).toBeTruthy()
      expect(hash).not.toBe(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('应该拒绝错误的密码', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword('WrongPassword', hash)
      expect(isValid).toBe(false)
    })

    it('每次加密应该产生不同的hash', async () => {
      const password = 'TestPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('generateRandomString', () => {
    it('应该生成指定长度的随机字符串', () => {
      const length = 16
      const result = generateRandomString(length)
      
      expect(result).toBeTruthy()
      expect(result.length).toBe(length)
    })

    it('应该生成不同的随机字符串', () => {
      const result1 = generateRandomString(32)
      const result2 = generateRandomString(32)
      
      expect(result1).not.toBe(result2)
    })

    it('默认长度应该是32', () => {
      const result = generateRandomString()
      expect(result.length).toBe(32)
    })
  })
})