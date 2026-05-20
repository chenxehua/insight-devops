// 巡检API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/checks/tasks - 巡检任务列表
router.get('/tasks', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.keyword) {
    where += ' AND task_name LIKE ?'
    params.push(`%${req.query.keyword}%`)
  }
  if (req.query.taskType) {
    where += ' AND task_type = ?'
    params.push(req.query.taskType)
  }
  if (req.query.status) {
    where += ' AND status = ?'
    params.push(req.query.status)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM check_tasks ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT id, task_name, task_type, target_id, check_items, schedule_type, schedule_cron,
           next_run_at, last_run_at, status, created_at, updated_at
    FROM check_tasks
    ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(t => ({
        id: t.id,
        taskName: t.task_name,
        taskType: t.task_type,
        targetId: t.target_id,
        checkItems: JSON.parse(t.check_items || '[]'),
        scheduleType: t.schedule_type,
        scheduleCron: t.schedule_cron,
        nextRunAt: t.next_run_at,
        lastRunAt: t.last_run_at,
        status: t.status,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/checks/tasks/:id - 巡检任务详情
router.get('/tasks/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const task = getOne('SELECT * FROM check_tasks WHERE id = ?', [id])
  
  if (!task) {
    return res.status(404).json({ code: 404, message: '巡检任务不存在' })
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: task.id,
      taskName: task.task_name,
      taskType: task.task_type,
      targetId: task.target_id,
      checkItems: JSON.parse(task.check_items || '[]'),
      scheduleType: task.schedule_type,
      scheduleCron: task.schedule_cron,
      nextRunAt: task.next_run_at,
      lastRunAt: task.last_run_at,
      status: task.status,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    }
  })
}))

// POST /api/checks/tasks - 创建巡检任务
router.post('/tasks', asyncHandler(async (req: Request, res: Response) => {
  const { taskName, taskType, targetId, checkItems, scheduleType, scheduleCron } = req.body
  
  if (!taskName || !checkItems || !Array.isArray(checkItems) || checkItems.length === 0) {
    return res.status(400).json({ code: 400, message: '任务名称和巡检项不能为空' })
  }
  
  // 计算下次执行时间
  let nextRunAt: string | null = null
  if (scheduleType && scheduleType !== 'once') {
    // TODO: 根据cron表达式计算下次执行时间
    const nextRun = new Date()
    nextRun.setHours(nextRun.getHours() + 1)
    nextRunAt = nextRun.toISOString()
  }
  
  runQuery(`
    INSERT INTO check_tasks (task_name, task_type, target_id, check_items, schedule_type, schedule_cron, next_run_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    taskName, taskType || null, targetId || null,
    JSON.stringify(checkItems), scheduleType || 'once', scheduleCron || null, nextRunAt
  ])
  
  const taskId = getLastInsertRowId()
  
  res.json({ code: 200, message: '创建成功', data: { id: taskId } })
}))

// PUT /api/checks/tasks/:id - 更新巡检任务
router.put('/tasks/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const task = getOne('SELECT id FROM check_tasks WHERE id = ?', [id])
  if (!task) {
    return res.status(404).json({ code: 404, message: '巡检任务不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    taskName: 'task_name', taskType: 'task_type', targetId: 'target_id',
    scheduleType: 'schedule_type', scheduleCron: 'schedule_cron', status: 'status'
  }
  
  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      params.push(req.body[key])
    }
  }
  
  if (req.body.checkItems !== undefined) {
    updates.push('check_items = ?')
    params.push(JSON.stringify(req.body.checkItems))
  }
  
  // 计算下次执行时间
  if (req.body.scheduleType && req.body.scheduleType !== 'once') {
    const nextRun = new Date()
    nextRun.setHours(nextRun.getHours() + 1)
    updates.push('next_run_at = ?')
    params.push(nextRun.toISOString())
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE check_tasks SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/checks/tasks/:id - 删除巡检任务
router.delete('/tasks/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM check_tasks WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '巡检任务不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

// POST /api/checks/tasks/:id/execute - 执行巡检任务
router.post('/tasks/:id/execute', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const task = getOne('SELECT id FROM check_tasks WHERE id = ?', [id])
  if (!task) {
    return res.status(404).json({ code: 404, message: '巡检任务不存在' })
  }
  
  // 创建巡检报告
  runQuery(`
    INSERT INTO check_reports (task_id, status)
    VALUES (?, 'running')
  `, [id])
  
  const reportId = getLastInsertRowId()
  
  // 更新任务最后执行时间
  runQuery(`
    UPDATE check_tasks SET last_run_at = datetime('now'), updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  res.json({ code: 200, message: '巡检任务已启动', data: { id: reportId } })
}))

// GET /api/checks/tasks/:id/reports - 巡检报告列表
router.get('/tasks/:id/reports', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { page, pageSize } = parsePagination(req.query)
  
  const totalResult = getOne('SELECT COUNT(*) as count FROM check_reports WHERE task_id = ?', [id])
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const reports = getAll(`
    SELECT id, task_id, start_at, end_at, result, summary, status, created_at
    FROM check_reports
    WHERE task_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [id, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      reports.map(r => ({
        id: r.id,
        taskId: r.task_id,
        startAt: r.start_at,
        endAt: r.end_at,
        result: r.result ? JSON.parse(r.result) : null,
        summary: r.summary,
        status: r.status,
        createdAt: r.created_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// 巡检报告列表
router.get('/reports', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.taskId) {
    where += ' AND cr.task_id = ?'
    params.push(parseInt(req.query.taskId as string))
  }
  if (req.query.status) {
    where += ' AND cr.status = ?'
    params.push(req.query.status)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM check_reports cr ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT cr.id, cr.task_id, cr.start_at, cr.end_at, cr.result, cr.summary, cr.status, cr.created_at,
           ct.task_name, ct.task_type
    FROM check_reports cr
    INNER JOIN check_tasks ct ON cr.task_id = ct.id
    ${where}
    ORDER BY cr.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(r => ({
        id: r.id,
        taskId: r.task_id,
        taskName: r.task_name,
        taskType: r.task_type,
        startAt: r.start_at,
        endAt: r.end_at,
        result: r.result ? JSON.parse(r.result) : null,
        summary: r.summary,
        status: r.status,
        createdAt: r.created_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/checks/reports/:id - 巡检报告详情
router.get('/reports/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const report = getOne(`
    SELECT cr.*, ct.task_name, ct.task_type, ct.check_items
    FROM check_reports cr
    INNER JOIN check_tasks ct ON cr.task_id = ct.id
    WHERE cr.id = ?
  `, [id])
  
  if (!report) {
    return res.status(404).json({ code: 404, message: '巡检报告不存在' })
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: report.id,
      taskId: report.task_id,
      taskName: report.task_name,
      taskType: report.task_type,
      checkItems: JSON.parse(report.check_items || '[]'),
      startAt: report.start_at,
      endAt: report.end_at,
      result: report.result ? JSON.parse(report.result) : null,
      summary: report.summary,
      status: report.status,
      createdAt: report.created_at,
    }
  })
}))

// 更新巡检报告
router.put('/reports/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const report = getOne('SELECT id FROM check_reports WHERE id = ?', [id])
  if (!report) {
    return res.status(404).json({ code: 404, message: '巡检报告不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    result: 'result', summary: 'summary', status: 'status'
  }
  
  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      if (key === 'result') {
        params.push(req.body[key] ? JSON.stringify(req.body[key]) : null)
      } else {
        params.push(req.body[key])
      }
    }
  }
  
  if (req.body.startAt !== undefined) {
    updates.push('start_at = ?')
    params.push(req.body.startAt ? new Date().toISOString() : null)
  }
  if (req.body.endAt !== undefined) {
    updates.push('end_at = ?')
    params.push(req.body.endAt ? new Date().toISOString() : null)
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE check_reports SET ${updates.join(', ')} WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

export default router