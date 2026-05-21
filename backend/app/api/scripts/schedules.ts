// 脚本定时任务API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/scripts/schedules - 定时任务列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.scriptId) {
    where += ' AND ss.script_id = ?'
    params.push(parseInt(req.query.scriptId as string))
  }
  if (req.query.status) {
    where += ' AND ss.status = ?'
    params.push(req.query.status)
  }
  if (req.query.scheduleType) {
    where += ' AND ss.schedule_type = ?'
    params.push(req.query.scheduleType)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM script_schedules ss ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT ss.id, ss.script_id, ss.task_name, ss.schedule_type, ss.cron_expression,
           ss.interval_seconds, ss.execute_time, ss.next_run_at, ss.last_run_at,
           ss.params, ss.target_host, ss.status, ss.consecutive_fails,
           ss.created_by, ss.created_at, ss.updated_at,
           s.script_name, s.script_code,
           u.username as created_by_name
    FROM script_schedules ss
    INNER JOIN scripts s ON ss.script_id = s.id
    LEFT JOIN users u ON ss.created_by = u.id
    ${where}
    ORDER BY ss.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(s => ({
        id: s.id,
        scriptId: s.script_id,
        scriptName: s.script_name,
        scriptCode: s.script_code,
        taskName: s.task_name,
        scheduleType: s.schedule_type,
        cronExpression: s.cron_expression,
        intervalSeconds: s.interval_seconds,
        executeTime: s.execute_time,
        nextRunAt: s.next_run_at,
        lastRunAt: s.last_run_at,
        params: s.params ? JSON.parse(s.params) : null,
        targetHost: s.target_host,
        status: s.status,
        consecutiveFails: s.consecutive_fails,
        createdBy: s.created_by,
        createdByName: s.created_by_name,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/scripts/schedules/:id - 定时任务详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const schedule = getOne(`
    SELECT ss.*, s.script_name, s.script_code, s.script_type,
           u.username as created_by_name
    FROM script_schedules ss
    INNER JOIN scripts s ON ss.script_id = s.id
    LEFT JOIN users u ON ss.created_by = u.id
    WHERE ss.id = ?
  `, [id])
  
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '定时任务不存在' })
  }
  
  // 获取执行历史
  const executions = getAll(`
    SELECT id, status, started_at, finished_at, output
    FROM script_executions
    WHERE script_id = ? AND params LIKE ?
    ORDER BY created_at DESC
    LIMIT 10
  `, [schedule.script_id, `%${schedule.id}%`])
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: schedule.id,
      scriptId: schedule.script_id,
      scriptName: schedule.script_name,
      scriptCode: schedule.script_code,
      scriptType: schedule.script_type,
      taskName: schedule.task_name,
      scheduleType: schedule.schedule_type,
      cronExpression: schedule.cron_expression,
      intervalSeconds: schedule.interval_seconds,
      executeTime: schedule.execute_time,
      nextRunAt: schedule.next_run_at,
      lastRunAt: schedule.last_run_at,
      params: schedule.params ? JSON.parse(schedule.params) : null,
      targetHost: schedule.target_host,
      status: schedule.status,
      consecutiveFails: schedule.consecutive_fails,
      createdBy: schedule.created_by,
      createdByName: schedule.created_by_name,
      createdAt: schedule.created_at,
      updatedAt: schedule.updated_at,
      recentExecutions: executions.map(e => ({
        id: e.id,
        status: e.status,
        startedAt: e.started_at,
        finishedAt: e.finished_at,
        output: e.output,
      }))
    }
  })
}))

// POST /api/scripts/schedules - 创建定时任务
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { 
    scriptId, taskName, scheduleType, cronExpression, intervalSeconds, 
    executeTime, params, targetHost 
  } = req.body
  
  if (!scriptId || !taskName || !scheduleType) {
    return res.status(400).json({ code: 400, message: '脚本ID、任务名称和调度类型不能为空' })
  }
  
  // 验证脚本存在
  const script = getOne('SELECT id FROM scripts WHERE id = ?', [scriptId])
  if (!script) {
    return res.status(404).json({ code: 404, message: '脚本不存在' })
  }
  
  // 验证调度类型参数
  if (scheduleType === 'cron' && !cronExpression) {
    return res.status(400).json({ code: 400, message: 'Cron表达式不能为空' })
  }
  if (scheduleType === 'interval' && !intervalSeconds) {
    return res.status(400).json({ code: 400, message: '间隔秒数不能为空' })
  }
  if (scheduleType === 'once' && !executeTime) {
    return res.status(400).json({ code: 400, message: '执行时间不能为空' })
  }
  
  // 计算下次执行时间
  let nextRunAt: string | null = null
  const now = new Date()
  
  if (scheduleType === 'once') {
    nextRunAt = new Date(executeTime).toISOString()
  } else if (scheduleType === 'interval') {
    nextRunAt = new Date(now.getTime() + intervalSeconds * 1000).toISOString()
  } else if (scheduleType === 'cron') {
    // TODO: 使用cron-parser计算下次执行时间
    // 暂时设置为1小时后
    const next = new Date(now.getTime() + 3600000)
    nextRunAt = next.toISOString()
  }
  
  runQuery(`
    INSERT INTO script_schedules (script_id, task_name, schedule_type, cron_expression,
      interval_seconds, execute_time, next_run_at, params, target_host, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    scriptId, taskName, scheduleType, cronExpression || null,
    intervalSeconds || null, executeTime || null, nextRunAt,
    params ? JSON.stringify(params) : null, targetHost || null,
    req.body.userId || null
  ])
  
  const scheduleId = getLastInsertRowId()
  
  res.json({ code: 200, message: '创建成功', data: { id: scheduleId } })
}))

// PUT /api/scripts/schedules/:id - 更新定时任务
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const schedule = getOne('SELECT id, status FROM script_schedules WHERE id = ?', [id])
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '定时任务不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    taskName: 'task_name', scheduleType: 'schedule_type',
    cronExpression: 'cron_expression', intervalSeconds: 'interval_seconds',
    executeTime: 'execute_time', targetHost: 'target_host', status: 'status'
  }
  
  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      params.push(req.body[key])
    }
  }
  
  if (req.body.params !== undefined) {
    updates.push('params = ?')
    params.push(req.body.params ? JSON.stringify(req.body.params) : null)
  }
  
  // 重新计算下次执行时间
  if (req.body.scheduleType || req.body.cronExpression || req.body.intervalSeconds || req.body.executeTime) {
    const scheduleType = req.body.scheduleType || schedule.schedule_type
    let nextRunAt: string | null = null
    
    if (scheduleType === 'once') {
      nextRunAt = req.body.executeTime ? new Date(req.body.executeTime).toISOString() : null
    } else if (scheduleType === 'interval') {
      const interval = req.body.intervalSeconds || schedule.interval_seconds
      nextRunAt = new Date(Date.now() + interval * 1000).toISOString()
    } else if (scheduleType === 'cron') {
      // TODO: 使用cron-parser计算
      nextRunAt = new Date(Date.now() + 3600000).toISOString()
    }
    
    updates.push('next_run_at = ?')
    params.push(nextRunAt)
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE script_schedules SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/scripts/schedules/:id - 删除定时任务
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM script_schedules WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '定时任务不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

// POST /api/scripts/schedules/:id/execute - 手动执行定时任务
router.post('/:id/execute', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const schedule = getOne('SELECT * FROM script_schedules WHERE id = ?', [id])
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '定时任务不存在' })
  }
  
  // 创建执行记录
  runQuery(`
    INSERT INTO script_executions (script_id, params, target_host, status)
    VALUES (?, ?, ?, 'pending')
  `, [schedule.script_id, schedule.params, schedule.target_host])
  
  const executionId = getLastInsertRowId()
  
  // 更新最后执行时间
  runQuery(`
    UPDATE script_schedules SET last_run_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `, [id])
  
  res.json({ code: 200, message: '任务已触发执行', data: { executionId } })
}))

// POST /api/scripts/schedules/:id/pause - 暂停定时任务
router.post('/:id/pause', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const schedule = getOne('SELECT id, status FROM script_schedules WHERE id = ?', [id])
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '定时任务不存在' })
  }
  
  if (schedule.status !== 'enabled') {
    return res.status(400).json({ code: 400, message: '任务未启用' })
  }
  
  runQuery(`
    UPDATE script_schedules SET status = 'paused', updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  res.json({ code: 200, message: '任务已暂停' })
}))

// POST /api/scripts/schedules/:id/resume - 恢复定时任务
router.post('/:id/resume', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const schedule = getOne('SELECT id, status FROM script_schedules WHERE id = ?', [id])
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '定时任务不存在' })
  }
  
  if (schedule.status !== 'paused') {
    return res.status(400).json({ code: 400, message: '任务未暂停' })
  }
  
  runQuery(`
    UPDATE script_schedules SET status = 'enabled', updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  res.json({ code: 200, message: '任务已恢复' })
}))

// POST /api/scripts/schedules/:id/stop - 停止定时任务
router.post('/:id/stop', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const schedule = getOne('SELECT id, status FROM script_schedules WHERE id = ?', [id])
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '定时任务不存在' })
  }
  
  runQuery(`
    UPDATE script_schedules SET status = 'stopped', updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  res.json({ code: 200, message: '任务已停止' })
}))

// GET /api/scripts/schedules/:id/history - 定时任务执行历史
router.get('/:id/history', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { page, pageSize } = parsePagination(req.query)
  
  const schedule = getOne('SELECT script_id FROM script_schedules WHERE id = ?', [id])
  if (!schedule) {
    return res.status(404).json({ code: 404, message: '定时任务不存在' })
  }
  
  const totalResult = getOne(
    'SELECT COUNT(*) as count FROM script_executions WHERE script_id = ?',
    [schedule.script_id]
  )
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const executions = getAll(`
    SELECT id, params, target_host, status, output, error_output,
           started_at, finished_at, created_at
    FROM script_executions
    WHERE script_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [schedule.script_id, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      executions.map(e => ({
        id: e.id,
        params: e.params ? JSON.parse(e.params) : null,
        targetHost: e.target_host,
        status: e.status,
        output: e.output,
        errorOutput: e.error_output,
        startedAt: e.started_at,
        finishedAt: e.finished_at,
        createdAt: e.created_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// 验证Cron表达式
router.post('/validate-cron', asyncHandler(async (req: Request, res: Response) => {
  const { cronExpression } = req.body
  
  if (!cronExpression) {
    return res.status(400).json({ code: 400, message: 'Cron表达式不能为空' })
  }
  
  // TODO: 使用cron-parser验证表达式
  // 这里简单验证格式
  const parts = cronExpression.split(' ')
  if (parts.length < 5 || parts.length > 6) {
    return res.status(400).json({ 
      code: 400, 
      message: '无效的Cron表达式格式',
      valid: false 
    })
  }
  
  res.json({ 
    code: 200, 
    message: 'Cron表达式格式正确',
    valid: true 
  })
}))

export default router