// 批量部署API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/deploys/batch - 批量任务列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.status) {
    where += ' AND bd.status = ?'
    params.push(req.query.status)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM batch_deployments bd ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT bd.id, bd.name, bd.description, bd.total_count, bd.success_count, 
           bd.failed_count, bd.running_count, bd.concurrency, bd.status,
           bd.started_at, bd.finished_at, bd.created_at, bd.updated_at,
           u.username as created_by_name
    FROM batch_deployments bd
    LEFT JOIN users u ON bd.created_by = u.id
    ${where}
    ORDER BY bd.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        totalCount: b.total_count,
        successCount: b.success_count,
        failedCount: b.failed_count,
        runningCount: b.running_count,
        concurrency: b.concurrency,
        status: b.status,
        startedAt: b.started_at,
        finishedAt: b.finished_at,
        createdBy: b.created_by,
        createdByName: b.created_by_name,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/deploys/batch/:id - 批量任务详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const batch = getOne(`
    SELECT bd.*, u.username as created_by_name
    FROM batch_deployments bd
    LEFT JOIN users u ON bd.created_by = u.id
    WHERE bd.id = ?
  `, [id])
  
  if (!batch) {
    return res.status(404).json({ code: 404, message: '批量任务不存在' })
  }
  
  // 获取子任务列表
  const tasks = getAll(`
    SELECT bdt.id, bdt.app_id, bdt.environment, bdt.version, bdt.status,
           bdt.error_message, bdt.started_at, bdt.finished_at, bdt.created_at,
           a.app_name, a.app_code,
           dt.id as deploy_task_id
    FROM batch_deployment_tasks bdt
    INNER JOIN apps a ON bdt.app_id = a.id
    LEFT JOIN deploy_tasks dt ON bdt.deploy_task_id = dt.id
    WHERE bdt.batch_id = ?
    ORDER BY bdt.created_at ASC
  `, [id])
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: batch.id,
      name: batch.name,
      description: batch.description,
      totalCount: batch.total_count,
      successCount: batch.success_count,
      failedCount: batch.failed_count,
      runningCount: batch.running_count,
      concurrency: batch.concurrency,
      status: batch.status,
      startedAt: batch.started_at,
      finishedAt: batch.finished_at,
      createdBy: batch.created_by,
      createdByName: batch.created_by_name,
      createdAt: batch.created_at,
      updatedAt: batch.updated_at,
      tasks: tasks.map(t => ({
        id: t.id,
        appId: t.app_id,
        appName: t.app_name,
        appCode: t.app_code,
        environment: t.environment,
        version: t.version,
        status: t.status,
        errorMessage: t.error_message,
        deployTaskId: t.deploy_task_id,
        startedAt: t.started_at,
        finishedAt: t.finished_at,
        createdAt: t.created_at,
      }))
    }
  })
}))

// POST /api/deploys/batch - 创建批量任务
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, description, concurrency, tasks } = req.body
  
  if (!name) {
    return res.status(400).json({ code: 400, message: '任务名称不能为空' })
  }
  
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ code: 400, message: '部署任务列表不能为空' })
  }
  
  // 验证所有应用存在
  for (const task of tasks) {
    const app = getOne('SELECT id FROM apps WHERE id = ?', [task.appId])
    if (!app) {
      return res.status(404).json({ code: 404, message: `应用ID ${task.appId} 不存在` })
    }
  }
  
  // 创建批量任务
  runQuery(`
    INSERT INTO batch_deployments (name, description, total_count, concurrency, created_by)
    VALUES (?, ?, ?, ?, ?)
  `, [name, description || null, tasks.length, concurrency || 5, req.body.userId || null])
  
  const batchId = getLastInsertRowId()
  
  // 创建子任务
  for (const task of tasks) {
    // 先创建部署任务
    runQuery(`
      INSERT INTO deploy_tasks (app_id, environment, version, strategy, status)
      VALUES (?, ?, ?, ?, 'pending')
    `, [task.appId, task.environment, task.version, task.strategy || 'normal'])
    
    const deployTaskId = getLastInsertRowId()
    
    // 创建批量子任务
    runQuery(`
      INSERT INTO batch_deployment_tasks (batch_id, deploy_task_id, app_id, environment, version)
      VALUES (?, ?, ?, ?, ?)
    `, [batchId, deployTaskId, task.appId, task.environment, task.version])
  }
  
  res.json({ code: 200, message: '创建成功', data: { id: batchId, taskCount: tasks.length } })
}))

// PUT /api/deploys/batch/:id - 更新批量任务
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const batch = getOne('SELECT id, status FROM batch_deployments WHERE id = ?', [id])
  if (!batch) {
    return res.status(404).json({ code: 404, message: '批量任务不存在' })
  }
  
  if (batch.status === 'running') {
    return res.status(400).json({ code: 400, message: '任务正在执行中，无法修改' })
  }
  
  const { name, description, concurrency } = req.body
  const updates: string[] = []
  const params: any[] = []
  
  if (name !== undefined) {
    updates.push('name = ?')
    params.push(name)
  }
  if (description !== undefined) {
    updates.push('description = ?')
    params.push(description)
  }
  if (concurrency !== undefined) {
    updates.push('concurrency = ?')
    params.push(concurrency)
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE batch_deployments SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/deploys/batch/:id - 删除批量任务
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const batch = getOne('SELECT id, status FROM batch_deployments WHERE id = ?', [id])
  if (!batch) {
    return res.status(404).json({ code: 404, message: '批量任务不存在' })
  }
  
  if (batch.status === 'running') {
    return res.status(400).json({ code: 400, message: '任务正在执行中，无法删除' })
  }
  
  // 先删除子任务
  runQuery('DELETE FROM batch_deployment_tasks WHERE batch_id = ?', [id])
  // 再删除批量任务
  runQuery('DELETE FROM batch_deployments WHERE id = ?', [id])
  
  res.json({ code: 200, message: '删除成功' })
}))

// POST /api/deploys/batch/:id/execute - 执行批量部署
router.post('/:id/execute', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const batch = getOne('SELECT id, status, concurrency FROM batch_deployments WHERE id = ?', [id])
  if (!batch) {
    return res.status(404).json({ code: 404, message: '批量任务不存在' })
  }
  
  if (batch.status === 'running') {
    return res.status(400).json({ code: 400, message: '任务正在执行中' })
  }
  
  // 获取待执行的子任务
  const tasks = getAll(`
    SELECT id, deploy_task_id FROM batch_deployment_tasks 
    WHERE batch_id = ? AND status IN ('pending', 'failed')
  `, [id])
  
  if (tasks.length === 0) {
    return res.status(400).json({ code: 400, message: '没有可执行的任务' })
  }
  
  // 更新批量任务状态
  runQuery(`
    UPDATE batch_deployments SET status = 'running', started_at = datetime('now'),
    running_count = ?, updated_at = datetime('now') WHERE id = ?
  `, [tasks.length, id])
  
  // 更新子任务状态为pending
  runQuery(`
    UPDATE batch_deployment_tasks SET status = 'pending', updated_at = datetime('now')
    WHERE batch_id = ? AND status IN ('pending', 'failed')
  `, [id])
  
  // 模拟批量执行（实际场景中应该使用消息队列或异步任务）
  // 这里直接更新状态为running，实际执行由后台任务处理
  for (const task of tasks) {
    runQuery(`
      UPDATE batch_deployment_tasks SET status = 'running', started_at = datetime('now'),
      updated_at = datetime('now') WHERE id = ?
    `, [task.id])
    
    // 更新关联的部署任务状态
    runQuery(`
      UPDATE deploy_tasks SET status = 'running', started_at = datetime('now'),
      updated_at = datetime('now') WHERE id = ?
    `, [task.deploy_task_id])
  }
  
  res.json({ code: 200, message: '批量部署已启动', data: { taskCount: tasks.length } })
}))

// POST /api/deploys/batch/:id/pause - 暂停批量部署
router.post('/:id/pause', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const batch = getOne('SELECT id, status FROM batch_deployments WHERE id = ?', [id])
  if (!batch) {
    return res.status(404).json({ code: 404, message: '批量任务不存在' })
  }
  
  if (batch.status !== 'running') {
    return res.status(400).json({ code: 400, message: '任务不在执行中' })
  }
  
  runQuery(`
    UPDATE batch_deployments SET status = 'paused', updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  // 暂停所有running状态的子任务
  runQuery(`
    UPDATE batch_deployment_tasks SET status = 'paused', updated_at = datetime('now')
    WHERE batch_id = ? AND status = 'running'
  `, [id])
  
  res.json({ code: 200, message: '批量部署已暂停' })
}))

// POST /api/deploys/batch/:id/resume - 继续批量部署
router.post('/:id/resume', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const batch = getOne('SELECT id, status FROM batch_deployments WHERE id = ?', [id])
  if (!batch) {
    return res.status(404).json({ code: 404, message: '批量任务不存在' })
  }
  
  if (batch.status !== 'paused') {
    return res.status(400).json({ code: 400, message: '任务不在暂停状态' })
  }
  
  runQuery(`
    UPDATE batch_deployments SET status = 'running', updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  // 恢复所有paused状态的子任务
  runQuery(`
    UPDATE batch_deployment_tasks SET status = 'running', updated_at = datetime('now')
    WHERE batch_id = ? AND status = 'paused'
  `, [id])
  
  res.json({ code: 200, message: '批量部署已继续' })
}))

// POST /api/deploys/batch/:id/cancel - 取消批量部署
router.post('/:id/cancel', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const batch = getOne('SELECT id, status FROM batch_deployments WHERE id = ?', [id])
  if (!batch) {
    return res.status(404).json({ code: 404, message: '批量任务不存在' })
  }
  
  if (batch.status === 'completed' || batch.status === 'failed') {
    return res.status(400).json({ code: 400, message: '任务已完成，无法取消' })
  }
  
  // 更新批量任务状态
  runQuery(`
    UPDATE batch_deployments SET status = 'cancelled', finished_at = datetime('now'),
    updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  // 取消所有pending/running的子任务
  runQuery(`
    UPDATE batch_deployment_tasks SET status = 'cancelled', finished_at = datetime('now'),
    updated_at = datetime('now')
    WHERE batch_id = ? AND status IN ('pending', 'running', 'paused')
  `, [id])
  
  res.json({ code: 200, message: '批量部署已取消' })
}))

// GET /api/deploys/batch/:id/tasks - 获取批量任务子任务列表
router.get('/:id/tasks', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { page, pageSize } = parsePagination(req.query)
  
  const totalResult = getOne('SELECT COUNT(*) as count FROM batch_deployment_tasks WHERE batch_id = ?', [id])
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const tasks = getAll(`
    SELECT bdt.id, bdt.app_id, bdt.environment, bdt.version, bdt.status,
           bdt.error_message, bdt.started_at, bdt.finished_at, bdt.created_at,
           a.app_name, a.app_code,
           dt.id as deploy_task_id, dt.progress as deploy_progress
    FROM batch_deployment_tasks bdt
    INNER JOIN apps a ON bdt.app_id = a.id
    LEFT JOIN deploy_tasks dt ON bdt.deploy_task_id = dt.id
    WHERE bdt.batch_id = ?
    ORDER BY bdt.created_at ASC
    LIMIT ? OFFSET ?
  `, [id, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      tasks.map(t => ({
        id: t.id,
        appId: t.app_id,
        appName: t.app_name,
        appCode: t.app_code,
        environment: t.environment,
        version: t.version,
        status: t.status,
        errorMessage: t.error_message,
        deployTaskId: t.deploy_task_id,
        deployProgress: t.deploy_progress,
        startedAt: t.started_at,
        finishedAt: t.finished_at,
        createdAt: t.created_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// POST /api/deploys/batch/:id/retry - 重试失败任务
router.post('/:id/retry', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const batch = getOne('SELECT id, status FROM batch_deployments WHERE id = ?', [id])
  if (!batch) {
    return res.status(404).json({ code: 404, message: '批量任务不存在' })
  }
  
  // 获取失败的任务
  const failedTasks = getAll(`
    SELECT id, deploy_task_id FROM batch_deployment_tasks 
    WHERE batch_id = ? AND status = 'failed'
  `, [id])
  
  if (failedTasks.length === 0) {
    return res.status(400).json({ code: 400, message: '没有失败的任务需要重试' })
  }
  
  // 重置失败任务状态
  for (const task of failedTasks) {
    runQuery(`
      UPDATE batch_deployment_tasks SET status = 'pending', error_message = NULL,
      started_at = NULL, finished_at = NULL, updated_at = datetime('now')
      WHERE id = ?
    `, [task.id])
    
    runQuery(`
      UPDATE deploy_tasks SET status = 'pending', started_at = NULL, finished_at = NULL,
      updated_at = datetime('now') WHERE id = ?
    `, [task.deploy_task_id])
  }
  
  // 更新批量任务统计
  runQuery(`
    UPDATE batch_deployments SET 
      failed_count = 0,
      running_count = failed_count + ?,
      status = CASE WHEN status = 'failed' THEN 'running' ELSE status END,
      updated_at = datetime('now')
    WHERE id = ?
  `, [failedTasks.length, id])
  
  res.json({ code: 200, message: `已重试 ${failedTasks.length} 个失败任务` })
}))

export default router