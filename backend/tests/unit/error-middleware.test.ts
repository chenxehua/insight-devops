// Error Middleware 单元测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { errorMiddleware, notFoundMiddleware, asyncHandler } from '@/lib/middleware/error'

describe('Error Middleware Tests', () => {
  let mockReq: Partial<Request>
  let mockRes: Partial<Response>
  let mockNext: NextFunction

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/test',
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    mockNext = vi.fn()
  })

  describe('errorMiddleware', () => {
    it('应该处理Error对象', () => {
      const error = new Error('Test error')
      const middleware = errorMiddleware()
      
      middleware(error, mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 500,
          message: 'Test error',
        })
      )
    })

    it('应该处理字符串错误', () => {
      const middleware = errorMiddleware()
      
      middleware('String error' as any, mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(500)
    })

    it('应该处理带status的错误对象', () => {
      const error = new Error('Bad Request')
      error.status = 400
      const middleware = errorMiddleware()
      
      middleware(error, mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('应该处理带code的错误对象', () => {
      const error = new Error('Custom error')
      ;(error as any).code = 1001
      const middleware = errorMiddleware()
      
      middleware(error, mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 1001,
        })
      )
    })

    it('应该处理Zod错误', () => {
      const error = new Error('Validation error')
      ;(error as any).errors = [
        { path: 'field', message: 'Required' }
      ]
      const middleware = errorMiddleware()
      
      middleware(error, mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
    })

    it('应该处理404错误', () => {
      const error = new Error('Not Found')
      error.status = 404
      const middleware = errorMiddleware()
      
      middleware(error, mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(404)
    })

    it('应该处理401错误', () => {
      const error = new Error('Unauthorized')
      error.status = 401
      const middleware = errorMiddleware()
      
      middleware(error, mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('默认status为500', () => {
      const error = new Error('Server error')
      const middleware = errorMiddleware()
      
      middleware(error, mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(500)
    })
  })

  describe('notFoundMiddleware', () => {
    it('应该返回404状态', () => {
      notFoundMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 404,
          message: 'Resource not found',
        })
      )
    })

    it('应该包含请求路径', () => {
      mockReq.path = '/unknown/path'
      notFoundMiddleware(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('/unknown/path'),
        })
      )
    })
  })

  describe('asyncHandler', () => {
    it('应该包装异步函数', async () => {
      const asyncFn = async () => 'success'
      const wrapped = asyncHandler(asyncFn)
      
      await wrapped(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('应该捕获异步错误', async () => {
      const asyncFn = async () => {
        throw new Error('Async error')
      }
      const wrapped = asyncHandler(asyncFn)
      
      await wrapped(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })

    it('应该传递同步错误', () => {
      const syncFn = () => {
        throw new Error('Sync error')
      }
      const wrapped = asyncHandler(syncFn as any)
      
      wrapped(mockReq as Request, mockRes as Response, mockNext)
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error))
    })

    it('应该支持asyncHandler返回函数', async () => {
      const handler = asyncHandler(async (req: Request, res: Response) => {
        res.json({ success: true })
      })
      
      const fn = handler(mockReq as Request, mockRes as Response, mockNext)
      
      await fn
      expect(mockNext).not.toHaveBeenCalled()
    })
  })
})