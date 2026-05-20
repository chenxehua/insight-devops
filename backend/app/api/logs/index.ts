// 日志API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/logs - 日志列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.level) {
    where += ' AND level = ?'
    params.push(req.query.level)
  }
  if (req.query.service) {
    where += ' AND service = ?'
    params.push(req.query.service)
  }
  if (req.query.host) {
    where += ' AND host LIKE ?'
    params.push(`%${req.query.host}%`)
  }
  if (req.query.keyword) {
    where += ' AND message LIKE ?'
    params.push(`%${req.query.keyword}%`)
  }
  if (req.query.startTime) {
    where += ' AND timestamp >= ?'
    params.push(req.query.startTime as string)
  }
  if (req.query.endTime) {
    where += ' AND timestamp <= ?'
    params.push(req.query.endTime as string)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM log_entries ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT id, timestamp, level, service, host, message, trace_id, span_id, extra, created_at
    FROM log_entries
    ${where}
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        level: l.level,
        service: l.service,
        host: l.host,
        message: l.message,
        traceId: l.trace_id,
        spanId: l.span_id,
        extra: l.extra ? JSON.parse(l.extra) : null,
        createdAt: l.created_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/logs/:id - 日志详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const log = getOne('SELECT * FROM log_entries WHERE id = ?', [id])
  
  if (!log) {
    return res.status(404).json({ code: 404, message: '日志不存在' })
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: log.id,
      timestamp: log.timestamp,
      level: log.level,
      service: log.service,
      host: log.host,
      message: log.message,
      traceId: log.trace_id,
      spanId: log.span_id,
      extra: log.extra ? JSON.parse(log.extra) : null,
      createdAt: log.created_at,
    }
  })
}))

// POST /api/logs - 写入日志
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { timestamp, level, service, host, message, traceId, spanId, extra } = req.body
  
  if (!level || !message) {
    return res.status(400).json({ code: 400, message: '日志级别和消息不能为空' })
  }
  
  runQuery(`
    INSERT INTO log_entries (timestamp, level, service, host, message, trace_id, span_id, extra)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    timestamp || new Date().toISOString(),
    level,
    service || null,
    host || null,
    message,
    traceId || null,
    spanId || null,
    extra ? JSON.stringify(extra) : null
  ])
  
  const logId = getLastInsertRowId()
  
  res.json({ code: 200, message: '日志写入成功', data: { id: logId } })
}))

// DELETE /api/logs - 清理日志
router.delete('/', asyncHandler(async (req: Request, res: Response) => {
  const { days } = req.body
  
  const daysToKeep = days || 30
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
  
  // 先获取要删除的数量
  const beforeCount = getOne('SELECT COUNT(*) as count FROM log_entries', [])?.count || 0
  
  runQuery('DELETE FROM log_entries WHERE timestamp < ?', [cutoffDate.toISOString()])
  
  const changes = getChanges()
  
  res.json({ code: 200, message: `已清理 ${changes} 条日志` })
}))

// GET /api/logs/stats - 日志统计
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const { startTime, endTime, service } = req.query
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (startTime) {
    where += ' AND timestamp >= ?'
    params.push(startTime as string)
  }
  if (endTime) {
    where += ' AND timestamp <= ?'
    params.push(endTime as string)
  }
  if (service) {
    where += ' AND service = ?'
    params.push(service as string)
  }
  
  // 统计各级别日志数量
  const levelStats = getAll(`
    SELECT level, COUNT(*) as count
    FROM log_entries
    ${where}
    GROUP BY level
  `, params)
  
  // 统计各服务日志数量
  const serviceStats = getAll(`
    SELECT service, COUNT(*) as count
    FROM log_entries
    ${where} AND service IS NOT NULL
    GROUP BY service
    ORDER BY count DESC
    LIMIT 10
  `, params)
  
  // 统计每小时日志趋势
  const hourlyStats = getAll(`
    SELECT strftime('%Y-%m-%d %H:00', timestamp) as hour, COUNT(*) as count
    FROM log_entries
    ${where}
    GROUP BY hour
    ORDER BY hour DESC
    LIMIT 24
  `, params)
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      levelStats: levelStats.map(s => ({ level: s.level, count: s.count })),
      serviceStats: serviceStats.map(s => ({ service: s.service, count: s.count })),
      hourlyStats: hourlyStats.map(s => ({ hour: s.hour, count: s.count })),
    }
  })
}))

export default router