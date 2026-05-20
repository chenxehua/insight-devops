// 认证中间件
import { Request, Response, NextFunction } from 'express'
import { verifyToken, TokenPayload } from '../utils/auth'
import { error } from '../utils/common'

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

// 认证中间件
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader) {
      res.status(401).json(error(401, '未提供认证令牌'))
      return
    }
    
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json(error(401, '认证令牌格式错误'))
      return
    }
    
    const token = parts[1]
    const payload = verifyToken(token)
    
    if (!payload) {
      res.status(401).json(error(401, '认证令牌无效或已过期'))
      return
    }
    
    req.user = payload
    next()
  } catch (err) {
    res.status(401).json(error(401, '认证失败'))
  }
}

// 可选认证中间件（不强制要求登录）
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader) {
      const parts = authHeader.split(' ')
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1]
        const payload = verifyToken(token)
        if (payload) {
          req.user = payload
        }
      }
    }
    
    next()
  } catch {
    next()
  }
}

export default { authMiddleware, optionalAuthMiddleware }