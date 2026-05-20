// 错误处理中间件
import { Request, Response, NextFunction } from 'express'
import { logError } from '../utils/logger'
import { error as apiError } from '../utils/common'

// 错误类型
export interface AppError extends Error {
  statusCode?: number
  code?: string
}

// 全局错误处理中间件
export function errorMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500
  const message = err.message || '服务器内部错误'
  
  logError(`${req.method} ${req.path}`, err)
  
  res.status(statusCode).json(
    apiError(statusCode, message)
  )
}

// 404 处理中间件
export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json(
    apiError(404, `路由 ${req.method} ${req.path} 不存在`)
  )
}

// 异步错误处理包装器
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 自定义错误类
export class HttpError extends Error {
  statusCode: number
  code: string
  
  constructor(statusCode: number, message: string, code?: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code || 'HTTP_ERROR'
    this.name = 'HttpError'
  }
}

// 常用错误工厂函数
export const Errors = {
  badRequest: (message: string = '请求参数错误') => new HttpError(400, message, 'BAD_REQUEST'),
  unauthorized: (message: string = '未认证') => new HttpError(401, message, 'UNAUTHORIZED'),
  forbidden: (message: string = '无权限') => new HttpError(403, message, 'FORBIDDEN'),
  notFound: (message: string = '资源不存在') => new HttpError(404, message, 'NOT_FOUND'),
  conflict: (message: string = '资源冲突') => new HttpError(409, message, 'CONFLICT'),
  internal: (message: string = '服务器内部错误') => new HttpError(500, message, 'INTERNAL_ERROR'),
}

export default {
  errorMiddleware,
  notFoundMiddleware,
  asyncHandler,
  HttpError,
  Errors,
}