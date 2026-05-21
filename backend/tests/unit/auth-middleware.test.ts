// Auth Middleware 单元测试
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { authMiddleware } from '@/lib/middleware/auth'
import { initDatabase, closeDatabase, resetDatabase } from '@/lib/database'

describe('Auth Middleware Tests', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction
  let authMiddlewareFn: ReturnType<typeof authMiddleware>

  beforeEach(async () => {
    await initDatabase()
    mockReq = {
      headers: {},
      cookies: {},
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
    }
    mockNext = vi.fn()
    authMiddlewareFn = authMiddleware()
  })

  afterEach(async () => {
    await resetDatabase()
    await closeDatabase()
    vi.clearAllMocks()
  })

  describe('正常认证流程', () => {
    it('应该通过有效token认证', async () => {
      // 先登录获取token
      const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      })
      
      // 由于是单元测试，使用模拟方式
      mockReq.headers = {
        authorization: 'Bearer valid-token',
      }
      
      authMiddlewareFn(mockReq as Request, mockRes as Response, mockNext)
      
      // 验证next被调用或返回401
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该从Cookie中获取token', () => {
      mockReq.cookies = {
        token: 'cookie-token',
      }
      
      authMiddlewareFn(mockReq as Request, mockRes as Response, mockNext)
      
      // 验证逻辑执行
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('认证失败场景', () => {
    it('无token应该返回401', () => {
      authMiddlewareFn(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 401 })
      )
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('无效token格式应该返回401', () => {
      mockReq.headers = {
        authorization: 'InvalidFormat token',
      }
      
      authMiddlewareFn(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('空token应该返回401', () => {
      mockReq.headers = {
        authorization: '',
      }
      
      authMiddlewareFn(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('过期token应该返回401', () => {
      mockReq.headers = {
        authorization: 'Bearer expired-token',
      }
      
      authMiddlewareFn(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })
  })

  describe('特殊场景', () => {
    it('Bearer和token之间无空格应该返回401', () => {
      mockReq.headers = {
        authorization: 'BearerToken',
      }
      
      authMiddlewareFn(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('只有Bearer前缀应该返回401', () => {
      mockReq.headers = {
        authorization: 'Bearer',
      }
      
      authMiddlewareFn(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('额外空格应该返回401', () => {
      mockReq.headers = {
        authorization: 'Bearer  extra token',
      }
      
      authMiddlewareFn(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })
  })
})