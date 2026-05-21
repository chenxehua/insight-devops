// 部署任务API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/deploys - 部署任务列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.appId) {
    where += ' AND dt.app_id = ?'
    params.push(parseInt(req.query.appId as string))
  }
  if (req.query.environment) {
    where += ' AND dt.environment = ?'
    params.push(req.query.environment)
  }
  if (req.query.status) {
    where += ' AND dt.status = ?'
    params.push(req.query.status)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM deploy_tasks dt ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT dt.id, dt.app_id, dt.environment, dt.version, dt.strategy, dt.status,
           dt.progress, dt.result, dt.executor_id, dt.started_at, dt.finished_at,
           dt.created_at, dt.updated_at,
           a.app_name, a.app_code,
           u.username as executor_name
    FROM deploy_tasks dt
    INNER JOIN apps a ON dt.app_id = a.id
    LEFT JOIN users u ON dt.executor_id = u.id
    ${where}
    ORDER BY dt.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(d => ({
        id: d.id,
        appId: d.app_id,
        appName: d.app_name,
        appCode: d.app_code,
        environment: d.environment,
        version: d.version,
        strategy: d.strategy,
        status: d.status,
        progress: d.progress,
        result: d.result,
        executorId: d.executor_id,
        executorName: d.executor_name,
        startedAt: d.started_at,
        finishedAt: d.finished_at,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/deploys/:id - 部署任务详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const task = getOne(`
    SELECT dt.*, a.app_name, a.app_code,
           u.username as executor_name
    FROM deploy_tasks dt
    INNER JOIN apps a ON dt.app_id = a.id
    LEFT JOIN users u ON dt.executor_id = u.id
    WHERE dt.id = ?
  `, [id])
  
  if (!task) {
    return res.status(404).json({ code: 404, message: '部署任务不存在' })
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: task.id,
      appId: task.app_id,
      appName: task.app_name,
      appCode: task.app_code,
      environment: task.environment,
      version: task.version,
      strategy: task.strategy,
      status: task.status,
      progress: task.progress,
      deployLog: task.deploy_log,
      result: task.result,
      executorId: task.executor_id,
      executorName: task.executor_name,
      startedAt: task.started_at,
      finishedAt: task.finished_at,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    }
  })
}))

// POST /api/deploys - 创建部署任务
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { appId, environment, version, strategy, executorId } = req.body
  
  if (!appId || !environment || !version) {
    return res.status(400).json({ code: 400, message: '应用ID、环境和版本不能为空' })
  }
  
  // 检查应用是否存在
  const app = getOne('SELECT id FROM apps WHERE id = ?', [appId])
  if (!app) {
    return res.status(404).json({ code: 404, message: '应用不存在' })
  }
  
  runQuery(`
    INSERT INTO deploy_tasks (app_id, environment, version, strategy, executor_id)
    VALUES (?, ?, ?, ?, ?)
  `, [appId, environment, version, strategy || 'normal', executorId || null])
  
  const id = getLastInsertRowId()
  
  res.json({ code: 200, message: '创建成功', data: { id } })
}))

// PUT /api/deploys/:id - 更新部署任务
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const task = getOne('SELECT id FROM deploy_tasks WHERE id = ?', [id])
  if (!task) {
    return res.status(404).json({ code: 404, message: '部署任务不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    environment: 'environment', version: 'version', strategy: 'strategy',
    status: 'status', progress: 'progress', result: 'result', executorId: 'executor_id'
  }
  
  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      params.push(req.body[key])
    }
  }
  
  // 处理时间字段
  if (req.body.startedAt !== undefined) {
    updates.push('started_at = ?')
    params.push(req.body.startedAt ? new Date().toISOString() : null)
  }
  if (req.body.finishedAt !== undefined) {
    updates.push('finished_at = ?')
    params.push(req.body.finishedAt ? new Date().toISOString() : null)
  }
  if (req.body.deployLog !== undefined) {
    updates.push('deploy_log = ?')
    params.push(req.body.deployLog)
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE deploy_tasks SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/deploys/:id - 删除部署任务
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM deploy_tasks WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '部署任务不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

// POST /api/deploys/:id/execute - 执行部署
router.post('/:id/execute', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const task = getOne('SELECT id, status FROM deploy_tasks WHERE id = ?', [id])
  if (!task) {
    return res.status(404).json({ code: 404, message: '部署任务不存在' })
  }
  
  if (task.status === 'running') {
    return res.status(400).json({ code: 400, message: '部署任务正在执行中' })
  }
  
  // 更新状态为running
  runQuery(`
    UPDATE deploy_tasks SET status = 'running', started_at = datetime('now'), 
    updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  res.json({ code: 200, message: '部署任务已启动' })
}))

// POST /api/deploys/:id/rollback - 回滚部署
router.post('/:id/rollback', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const task = getOne('SELECT id, status FROM deploy_tasks WHERE id = ?', [id])
  if (!task) {
    return res.status(404).json({ code: 404, message: '部署任务不存在' })
  }
  
  if (task.status !== 'failed') {
    return res.status(400).json({ code: 400, message: '只能回滚失败的部署任务' })
  }
  
  // 更新状态为rollback
  runQuery(`
    UPDATE deploy_tasks SET status = 'rollback', updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  res.json({ code: 200, message: '回滚任务已启动' })
}))

// POST /api/deploys/:id/cancel - 取消部署
router.post('/:id/cancel', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const task = getOne('SELECT id, status FROM deploy_tasks WHERE id = ?', [id])
  if (!task) {
    return res.status(404).json({ code: 404, message: '部署任务不存在' })
  }
  
  if (task.status === 'success' || task.status === 'failed') {
    return res.status(400).json({ code: 400, message: '已完成的部署任务无法取消' })
  }
  
  // 更新状态为cancelled
  runQuery(`
    UPDATE deploy_tasks SET status = 'cancelled', finished_at = datetime('now'),
    updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  res.json({ code: 200, message: '部署任务已取消' })
}))

// GET /api/deploys/:id/logs - 获取部署日志
router.get('/:id/logs', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const task = getOne('SELECT id, deploy_log, status FROM deploy_tasks WHERE id = ?', [id])
  if (!task) {
    return res.status(404).json({ code: 404, message: '部署任务不存在' })
  }
  
  // 模拟实时日志（实际场景中应该从日志系统获取）
  const logs = task.deploy_log ? task.deploy_log.split('\n') : []
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      taskId: id,
      status: task.status,
      logs: logs.map((line, index) => ({
        line: index + 1,
        content: line,
        timestamp: new Date(Date.now() - (logs.length - index) * 1000).toISOString()
      })),
      totalLines: logs.length
    }
  })
}))

export default router