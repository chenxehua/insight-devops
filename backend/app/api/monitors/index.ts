// 监控API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/monitors - 监控指标列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)

  let where = 'WHERE 1=1'
  const params: any[] = []

  if (req.query.keyword) {
    where += ' AND (monitor_name LIKE ? OR metric_name LIKE ?)'
    const keyword = `%${req.query.keyword}%`
    params.push(keyword, keyword)
  }
  if (req.query.targetType) {
    where += ' AND target_type = ?'
    params.push(req.query.targetType)
  }
  if (req.query.status) {
    where += ' AND status = ?'
    params.push(parseInt(req.query.status as string))
  }

  const totalResult = getOne(`SELECT COUNT(*) as count FROM monitors ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize

  const list = getAll(`
    SELECT id, monitor_name, metric_name, target_type, target_id, collect_type,
           collect_path, interval, description, status, created_at, updated_at
    FROM monitors
    ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])

  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(m => ({
        id: m.id,
        monitorName: m.monitor_name,
        metricName: m.metric_name,
        targetType: m.target_type,
        targetId: m.target_id,
        collectType: m.collect_type,
        collectPath: m.collect_path,
        interval: m.interval,
        description: m.description,
        status: m.status,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// ========== 告警相关路由 (必须在 /:id 之前) ==========

// GET /api/monitors/alerts/rules - 告警规则列表
router.get('/alerts/rules', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)

  const totalResult = getOne('SELECT COUNT(*) as count FROM alert_rules', [])
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize

  const list = getAll(`
    SELECT id, rule_name, target_type, target_id, metric_name, condition,
           threshold, duration, alert_level, message, notify_channels, notify_users,
           status, created_at, updated_at
    FROM alert_rules
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [pageSize, offset])

  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(r => ({
        id: r.id,
        ruleName: r.rule_name,
        targetType: r.target_type,
        targetId: r.target_id,
        metricName: r.metric_name,
        condition: r.condition,
        threshold: r.threshold,
        duration: r.duration,
        alertLevel: r.alert_level,
        message: r.message,
        notifyChannels: r.notify_channels ? JSON.parse(r.notify_channels) : [],
        notifyUsers: r.notify_users ? JSON.parse(r.notify_users) : [],
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// POST /api/monitors/alerts/rules - 创建告警规则
router.post('/alerts/rules', asyncHandler(async (req: Request, res: Response) => {
  const { ruleName, targetType, targetId, metricName, condition, threshold, duration, alertLevel, message, notifyChannels, notifyUsers } = req.body

  if (!ruleName || !targetType || !metricName || !condition || threshold === undefined || !alertLevel) {
    return res.status(400).json({ code: 400, message: '必填字段不能为空' })
  }

  runQuery(`
    INSERT INTO alert_rules (rule_name, target_type, target_id, metric_name, condition, threshold, duration, alert_level, message, notify_channels, notify_users)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    ruleName, targetType, targetId || null, metricName, condition, threshold,
    duration || 60, alertLevel, message || null,
    notifyChannels ? JSON.stringify(notifyChannels) : null,
    notifyUsers ? JSON.stringify(notifyUsers) : null
  ])

  const id = getLastInsertRowId()

  res.json({ code: 200, message: '创建成功', data: { id } })
}))

// PUT /api/monitors/alerts/rules/:id - 更新告警规则
router.put('/alerts/rules/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)

  const rule = getOne('SELECT id FROM alert_rules WHERE id = ?', [id])
  if (!rule) {
    return res.status(404).json({ code: 404, message: '告警规则不存在' })
  }

  const updates: string[] = []
  const params: any[] = []

  const fields: Record<string, string> = {
    ruleName: 'rule_name', targetType: 'target_type', targetId: 'target_id',
    metricName: 'metric_name', condition: 'condition', threshold: 'threshold',
    duration: 'duration', alertLevel: 'alert_level', message: 'message',
    notifyChannels: 'notify_channels', notifyUsers: 'notify_users', status: 'status'
  }

  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      if (key === 'notifyChannels' || key === 'notifyUsers') {
        params.push(req.body[key] ? JSON.stringify(req.body[key]) : null)
      } else {
        params.push(req.body[key])
      }
    }
  }

  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE alert_rules SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }

  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/monitors/alerts/rules/:id - 删除告警规则
router.delete('/alerts/rules/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)

  runQuery('DELETE FROM alert_rules WHERE id = ?', [id])

  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '告警规则不存在' })
  }

  res.json({ code: 200, message: '删除成功' })
}))

// GET /api/monitors/alerts - 告警列表
router.get('/alerts', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)

  let where = 'WHERE 1=1'
  const params: any[] = []

  if (req.query.status) {
    where += ' AND a.status = ?'
    params.push(req.query.status)
  }
  if (req.query.alertLevel) {
    where += ' AND a.alert_level = ?'
    params.push(req.query.alertLevel)
  }

  const totalResult = getOne(`SELECT COUNT(*) as count FROM alerts a ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize

  const list = getAll(`
    SELECT a.id, a.rule_id, a.alert_name, a.alert_level, a.target_type, a.target_id,
           a.metric_name, a.metric_value, a.threshold, a.message, a.status,
           a.handler_id, a.handle_time, a.handle_note, a.created_at, a.updated_at,
           u.username as handler_name, r.rule_name as rule_name
    FROM alerts a
    LEFT JOIN users u ON a.handler_id = u.id
    LEFT JOIN alert_rules r ON a.rule_id = r.id
    ${where}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])

  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(a => ({
        id: a.id,
        ruleId: a.rule_id,
        ruleName: a.rule_name,
        alertName: a.alert_name,
        alertLevel: a.alert_level,
        targetType: a.target_type,
        targetId: a.target_id,
        metricName: a.metric_name,
        metricValue: a.metric_value,
        threshold: a.threshold,
        message: a.message,
        status: a.status,
        handlerId: a.handler_id,
        handlerName: a.handler_name,
        handleTime: a.handle_time,
        handleNote: a.handle_note,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// PUT /api/monitors/alerts/:id/handle - 处理告警
router.put('/alerts/:id/handle', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { status, handleNote } = req.body

  const alert = getOne('SELECT id FROM alerts WHERE id = ?', [id])
  if (!alert) {
    return res.status(404).json({ code: 404, message: '告警不存在' })
  }

  const updates: string[] = []
  const params: any[] = []

  if (status) {
    updates.push('status = ?')
    params.push(status)
  }
  if (handleNote !== undefined) {
    updates.push('handle_note = ?')
    params.push(handleNote)
    updates.push('handle_time = datetime(\'now\')')
  }

  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE alerts SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }

  res.json({ code: 200, message: '处理成功' })
}))

// ========== 监控指标详情 (必须在 /alerts 之后) ==========

// GET /api/monitors/:id - 监控指标详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)

  const monitor = getOne('SELECT * FROM monitors WHERE id = ?', [id])

  if (!monitor) {
    return res.status(404).json({ code: 404, message: '监控指标不存在' })
  }

  res.json({
    code: 200,
    message: 'success',
    data: {
      id: monitor.id,
      monitorName: monitor.monitor_name,
      metricName: monitor.metric_name,
      targetType: monitor.target_type,
      targetId: monitor.target_id,
      collectType: monitor.collect_type,
      collectPath: monitor.collect_path,
      interval: monitor.interval,
      description: monitor.description,
      status: monitor.status,
      createdAt: monitor.created_at,
      updatedAt: monitor.updated_at,
    }
  })
}))

// POST /api/monitors - 创建监控指标
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { monitorName, metricName, targetType, targetId, collectType, collectPath, interval, description } = req.body

  if (!monitorName || !metricName || !targetType) {
    return res.status(400).json({ code: 400, message: '监控名称、指标名称和目标类型不能为空' })
  }

  runQuery(`
    INSERT INTO monitors (monitor_name, metric_name, target_type, target_id, collect_type, collect_path, interval, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    monitorName, metricName, targetType, targetId || null,
    collectType || 'agent', collectPath || null, interval || 10, description || null
  ])

  const id = getLastInsertRowId()

  res.json({ code: 200, message: '创建成功', data: { id } })
}))

// PUT /api/monitors/:id - 更新监控指标
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)

  const monitor = getOne('SELECT id FROM monitors WHERE id = ?', [id])
  if (!monitor) {
    return res.status(404).json({ code: 404, message: '监控指标不存在' })
  }

  const updates: string[] = []
  const params: any[] = []

  const fields: Record<string, string> = {
    monitorName: 'monitor_name', metricName: 'metric_name', targetType: 'target_type',
    targetId: 'target_id', collectType: 'collect_type', collectPath: 'collect_path',
    interval: 'interval', description: 'description', status: 'status'
  }

  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      params.push(req.body[key])
    }
  }

  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE monitors SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }

  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/monitors/:id - 删除监控指标
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)

  runQuery('DELETE FROM monitors WHERE id = ?', [id])

  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '监控指标不存在' })
  }

  res.json({ code: 200, message: '删除成功' })
}))

// GET /api/monitors/:id/metrics - 获取监控数据
router.get('/:id/metrics', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { startTime, endTime, limit } = req.query

  const monitor = getOne('SELECT id FROM monitors WHERE id = ?', [id])
  if (!monitor) {
    return res.status(404).json({ code: 404, message: '监控指标不存在' })
  }

  let where = 'WHERE monitor_id = ?'
  const params: any[] = [id]

  if (startTime) {
    where += ' AND timestamp >= ?'
    params.push(startTime)
  }
  if (endTime) {
    where += ' AND timestamp <= ?'
    params.push(endTime)
  }

  const data = getAll(`
    SELECT id, value, timestamp
    FROM metric_data
    ${where}
    ORDER BY timestamp DESC
    LIMIT ?
  `, [...params, parseInt(limit as string) || 100])

  res.json({
    code: 200,
    message: 'success',
    data: data.map(m => ({
      id: m.id,
      value: m.value,
      timestamp: m.timestamp,
    }))
  })
}))

// POST /api/monitors/:id/metrics - 上报监控数据
router.post('/:id/metrics', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { value, timestamp } = req.body

  if (value === undefined || value === null) {
    return res.status(400).json({ code: 400, message: '监控值不能为空' })
  }

  const monitor = getOne('SELECT id FROM monitors WHERE id = ?', [id])
  if (!monitor) {
    return res.status(404).json({ code: 404, message: '监控指标不存在' })
  }

  runQuery(`
    INSERT INTO metric_data (monitor_id, value, timestamp)
    VALUES (?, ?, ?)
  `, [id, value, timestamp || new Date().toISOString()])

  const insertId = getLastInsertRowId()

  res.json({ code: 200, message: '上报成功', data: { id: insertId } })
}))

export default router