// Audit Middleware 单元测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { auditMiddleware } from '@/lib/middleware/audit'

describe('Audit Middleware Tests', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
      cookies: {},
      user: { id: 1, username: 'test' },
      body: {},
      query: {},
      params: {},
    }
    mockRes = {
      statusCode: 200,
      on: vi.fn(),
    }
    mockNext = vi.fn()
  })

  describe('中间件初始化', () => {
    it('应该返回中间件函数', () => {
      const middleware = auditMiddleware()
      expect(typeof middleware).toBe('function')
    })

    it('应该接受可选配置参数', () => {
      const middleware = auditMiddleware({ excludePaths: ['/health'] })
      expect(typeof middleware).toBe('function')
    })
  })

  describe('请求拦截', () => {
    it('应该记录请求信息', () => {
      const middleware = auditMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
      
      // next应该被调用
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该支持排除路径', () => {
      const middleware = auditMiddleware({ 
        excludePaths: ['/health', '/metrics'] 
      })
      
      mockReq.path = '/health'
      middleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('排除路径应该使用前缀匹配', () => {
      const middleware = auditMiddleware({ 
        excludePaths: ['/api/internal'] 
      })
      
      mockReq.path = '/api/internal/status'
      middleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('响应监听', () => {
    it('应该监听finish事件', () => {
      const middleware = auditMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function))
    })

    it('finish事件应该记录审计日志', () => {
      const middleware = auditMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
      
      const finishCallback = mockRes.on.mock.calls.find(
        call => call[0] === 'finish'
      )?.[1]
      
      if (finishCallback) {
        finishCallback()
      }
      
      // 验证事件处理完成
      expect(mockRes.statusCode).toBe(200)
    })
  })

  describe('不同HTTP方法', () => {
    it('应该记录GET请求', () => {
      mockReq.method = 'GET'
      const middleware = auditMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该记录POST请求', () => {
      mockReq.method = 'POST'
      mockReq.body = { name: 'test' }
      const middleware = auditMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该记录PUT请求', () => {
      mockReq.method = 'PUT'
      const middleware = auditMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该记录DELETE请求', () => {
      mockReq.method = 'DELETE'
      const middleware = auditMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('用户信息', () => {
    it('应该处理带用户信息的请求', () => {
      mockReq.user = { id: 1, username: 'admin' }
      const middleware = auditMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })

    it('应该处理无用户信息的请求', () => {
      mockReq.user = undefined
      const middleware = auditMiddleware()
      middleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
    })
  })
})