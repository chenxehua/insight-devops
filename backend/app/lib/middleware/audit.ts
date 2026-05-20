// 审计日志中间件
import { Request, Response, NextFunction } from 'express'
import { getOne, runQuery } from '../database'
import { logInfo } from '../utils/logger'

// 审计日志参数
export interface AuditLogParams {
  action: string
  resourceType?: string
  resourceId?: number
  detail?: string
}

// 记录审计日志
export async function logAudit(params: AuditLogParams, user?: { userId: number; username: string }): Promise<void> {
  try {
    runQuery(`
      INSERT INTO audit_logs (user_id, username, action, resource_type, resource_id, detail, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user?.userId || null,
      user?.username || null,
      params.action,
      params.resourceType || null,
      params.resourceId || null,
      params.detail || null,
      null,
      null,
      new Date().toISOString()
    ])
  } catch (err) {
    console.error('审计日志记录失败:', err)
  }
}

// 审计日志中间件工厂
export function auditMiddleware(
  action: string = 'API_ACCESS',
  resourceType?: string,
  getResourceId?: (req: Request) => number | undefined
) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const resourceId = getResourceId ? getResourceId(req) : req.params.id ? parseInt(req.params.id) : undefined
        await logAudit(
          {
            action,
            resourceType: resourceType || req.baseUrl,
            resourceId,
          },
          req.user ? { userId: req.user.userId, username: req.user.username } : undefined
        )
      }
    })
    
    next()
  }
}

export default { logAudit, auditMiddleware }