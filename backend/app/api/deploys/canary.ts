// 金丝雀部署API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'

const router = Router()

router.use(authMiddleware)

// GET /api/deploys/canary - 金丝雀部署列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, pageSize = 10 } = req.query
  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string)
  
  const list = getAll(`
    SELECT cd.id, cd.deploy_task_id, cd.canary_ratio, cd.auto_promote, 
           cd.promote_conditions, cd.current_phase, cd.status, cd.started_at,
           cd.completed_at, cd.metrics, cd.created_at, cd.updated_at,
           dt.environment, dt.version, dt.status as deploy_status,
           a.app_name, a.app_code
    FROM canary_deployments cd
    INNER JOIN deploy_tasks dt ON cd.deploy_task_id = dt.id
    INNER JOIN apps a ON dt.app_id = a.id
    ORDER BY cd.created_at DESC
    LIMIT ? OFFSET ?
  `, [parseInt(pageSize as string), offset])
  
  const totalResult = getOne('SELECT COUNT(*) as count FROM canary_deployments')
  const total = totalResult?.count || 0
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: list.map(c => ({
        id: c.id,
        deployTaskId: c.deploy_task_id,
        canaryRatio: c.canary_ratio,
        autoPromote: c.auto_promote,
        promoteConditions: c.promote_conditions ? JSON.parse(c.promote_conditions) : null,
        currentPhase: c.current_phase,
        status: c.status,
        startedAt: c.started_at,
        completedAt: c.completed_at,
        metrics: c.metrics ? JSON.parse(c.metrics) : null,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        environment: c.environment,
        version: c.version,
        appName: c.app_name,
        appCode: c.app_code,
      })),
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string)
    }
  })
}))

// GET /api/deploys/canary/:id - 金丝雀部署详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const canary = getOne(`
    SELECT cd.*, dt.app_id, dt.environment, dt.version, dt.status as deploy_status,
           a.app_name, a.app_code
    FROM canary_deployments cd
    INNER JOIN deploy_tasks dt ON cd.deploy_task_id = dt.id
    INNER JOIN apps a ON dt.app_id = a.id
    WHERE cd.id = ?
  `, [id])
  
  if (!canary) {
    return res.status(404).json({ code: 404, message: '金丝雀部署不存在' })
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: canary.id,
      deployTaskId: canary.deploy_task_id,
      appId: canary.app_id,
      appName: canary.app_name,
      appCode: canary.app_code,
      environment: canary.environment,
      version: canary.version,
      canaryRatio: canary.canary_ratio,
      autoPromote: canary.auto_promote,
      promoteConditions: canary.promote_conditions ? JSON.parse(canary.promote_conditions) : null,
      currentPhase: canary.current_phase,
      status: canary.status,
      startedAt: canary.started_at,
      completedAt: canary.completed_at,
      metrics: canary.metrics ? JSON.parse(canary.metrics) : null,
      createdAt: canary.created_at,
      updatedAt: canary.updated_at,
    }
  })
}))

// POST /api/deploys/canary - 创建金丝雀部署
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { deployTaskId, canaryRatio, autoPromote, promoteConditions } = req.body
  
  if (!deployTaskId) {
    return res.status(400).json({ code: 400, message: '部署任务ID不能为空' })
  }
  
  // 验证部署任务存在
  const task = getOne('SELECT id, strategy FROM deploy_tasks WHERE id = ?', [deployTaskId])
  if (!task) {
    return res.status(404).json({ code: 404, message: '部署任务不存在' })
  }
  
  // 更新部署任务策略
  runQuery(`
    UPDATE deploy_tasks SET strategy = 'canary', updated_at = datetime('now') WHERE id = ?
  `, [deployTaskId])
  
  // 创建金丝雀部署记录
  runQuery(`
    INSERT INTO canary_deployments (deploy_task_id, canary_ratio, auto_promote, promote_conditions)
    VALUES (?, ?, ?, ?)
  `, [
    deployTaskId,
    canaryRatio || 10,
    autoPromote ? 1 : 0,
    promoteConditions ? JSON.stringify(promoteConditions) : null
  ])
  
  const id = getLastInsertRowId()
  
  res.json({ code: 200, message: '金丝雀部署创建成功', data: { id } })
}))

// PUT /api/deploys/canary/:id - 更新金丝雀部署
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const canary = getOne('SELECT id FROM canary_deployments WHERE id = ?', [id])
  if (!canary) {
    return res.status(404).json({ code: 404, message: '金丝雀部署不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  if (req.body.canaryRatio !== undefined) {
    updates.push('canary_ratio = ?')
    params.push(req.body.canaryRatio)
  }
  
  if (req.body.autoPromote !== undefined) {
    updates.push('auto_promote = ?')
    params.push(req.body.autoPromote ? 1 : 0)
  }
  
  if (req.body.promoteConditions !== undefined) {
    updates.push('promote_conditions = ?')
    params.push(JSON.stringify(req.body.promoteConditions))
  }
  
  if (req.body.currentPhase !== undefined) {
    updates.push('current_phase = ?')
    params.push(req.body.currentPhase)
  }
  
  if (req.body.status !== undefined) {
    updates.push('status = ?')
    params.push(req.body.status)
  }
  
  if (req.body.metrics !== undefined) {
    updates.push('metrics = ?')
    params.push(JSON.stringify(req.body.metrics))
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE canary_deployments SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// POST /api/deploys/canary/:id/promote - 提升金丝雀比例
router.post('/:id/promote', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { targetRatio } = req.body
  
  const canary = getOne('SELECT id, canary_ratio, current_phase, status, auto_promote FROM canary_deployments WHERE id = ?', [id])
  
  if (!canary) {
    return res.status(404).json({ code: 404, message: '金丝雀部署不存在' })
  }
  
  if (canary.status !== 'running') {
    return res.status(400).json({ code: 400, message: '任务不在运行状态' })
  }
  
  // 验证目标比例
  const validRatios = [10, 30, 50, 80, 100]
  const ratio = targetRatio || canary.canary_ratio
  
  if (!validRatios.includes(ratio)) {
    return res.status(400).json({ 
      code: 400, 
      message: '比例必须是: 10%, 30%, 50%, 80%, 100%' 
    })
  }
  
  if (ratio <= canary.canary_ratio) {
    return res.status(400).json({ 
      code: 400, 
      message: `目标比例必须大于当前比例 (当前: ${canary.canary_ratio}%)` 
    })
  }
  
  // 更新金丝雀比例
  runQuery(`
    UPDATE canary_deployments SET canary_ratio = ?, updated_at = datetime('now') WHERE id = ?
  `, [ratio, id])
  
  res.json({ 
    code: 200, 
    message: `金丝雀比例已提升至 ${ratio}%`,
    data: { canaryRatio: ratio }
  })
}))

// POST /api/deploys/canary/:id/pause - 暂停金丝雀部署
router.post('/:id/pause', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const canary = getOne('SELECT id, status, canary_ratio FROM canary_deployments WHERE id = ?', [id])
  if (!canary) {
    return res.status(404).json({ code: 404, message: '金丝雀部署不存在' })
  }
  
  if (canary.status !== 'running') {
    return res.status(400).json({ code: 400, message: '任务不在运行状态' })
  }
  
  runQuery(`
    UPDATE canary_deployments SET current_phase = 'paused', updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  res.json({ 
    code: 200, 
    message: `金丝雀部署已暂停在 ${canary.canary_ratio}%`,
    data: { canaryRatio: canary.canary_ratio }
  })
}))

// POST /api/deploys/canary/:id/resume - 恢复金丝雀部署
router.post('/:id/resume', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const canary = getOne('SELECT id, current_phase, canary_ratio FROM canary_deployments WHERE id = ?', [id])
  if (!canary) {
    return res.status(404).json({ code: 404, message: '金丝雀部署不存在' })
  }
  
  if (canary.current_phase !== 'paused') {
    return res.status(400).json({ code: 400, message: '任务不在暂停状态' })
  }
  
  runQuery(`
    UPDATE canary_deployments SET current_phase = 'running', updated_at = datetime('now') WHERE id = ?
  `, [id])
  
  res.json({ 
    code: 200, 
    message: '金丝雀部署已恢复',
    data: { canaryRatio: canary.canary_ratio }
  })
}))

// POST /api/deploys/canary/:id/rollback - 金丝雀回滚
router.post('/:id/rollback', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const canary = getOne('SELECT id, status, deploy_task_id FROM canary_deployments WHERE id = ?', [id])
  if (!canary) {
    return res.status(404).json({ code: 404, message: '金丝雀部署不存在' })
  }
  
  if (canary.status === 'rolled_back') {
    return res.status(400).json({ code: 400, message: '已回滚，无需重复操作' })
  }
  
  // 更新金丝雀部署状态
  runQuery(`
    UPDATE canary_deployments SET 
      status = 'rolled_back', 
      current_phase = 'failed',
      updated_at = datetime('now')
    WHERE id = ?
  `, [id])
  
  // 更新部署任务状态
  runQuery(`
    UPDATE deploy_tasks SET status = 'rollback', updated_at = datetime('now') WHERE id = ?
  `, [canary.deploy_task_id])
  
  res.json({ code: 200, message: '金丝雀回滚已触发，流量切回稳定版本' })
}))

// POST /api/deploys/canary/:id/complete - 完成金丝雀部署
router.post('/:id/complete', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const canary = getOne('SELECT id, status, canary_ratio FROM canary_deployments WHERE id = ?', [id])
  if (!canary) {
    return res.status(404).json({ code: 404, message: '金丝雀部署不存在' })
  }
  
  if (canary.status !== 'running') {
    return res.status(400).json({ code: 400, message: '任务不在运行状态' })
  }
  
  if (canary.canary_ratio < 100) {
    return res.status(400).json({ code: 400, message: '请先将金丝雀比例提升至100%' })
  }
  
  // 完成金丝雀部署
  runQuery(`
    UPDATE canary_deployments SET 
      status = 'success', 
      current_phase = 'completed',
      completed_at = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ?
  `, [id])
  
  res.json({ code: 200, message: '金丝雀部署已完成，流量已全部切换到新版本' })
}))

// GET /api/deploys/canary/:id/metrics - 获取金丝雀指标
router.get('/:id/metrics', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const canary = getOne('SELECT canary_ratio, current_phase, status, metrics FROM canary_deployments WHERE id = ?', [id])
  
  if (!canary) {
    return res.status(404).json({ code: 404, message: '金丝雀部署不存在' })
  }
  
  // 返回模拟的监控指标对比（实际场景从监控系统获取）
  const mockMetrics = {
    stable: {
      cpuUsage: Math.random() * 80 + 10,
      memoryUsage: Math.random() * 70 + 20,
      requestCount: Math.floor(Math.random() * 5000 + 1000),
      errorRate: Math.random() * 2,
      avgResponseTime: Math.random() * 300 + 50,
      p99Latency: Math.random() * 500 + 100,
    },
    canary: {
      cpuUsage: Math.random() * 80 + 10,
      memoryUsage: Math.random() * 70 + 20,
      requestCount: Math.floor(Math.random() * 500 + 100),
      errorRate: Math.random() * 2,
      avgResponseTime: Math.random() * 300 + 50,
      p99Latency: Math.random() * 500 + 100,
    },
    comparison: {
      errorRateDiff: (Math.random() - 0.5) * 2,
      responseTimeDiff: (Math.random() - 0.5) * 100,
      isHealthy: Math.random() > 0.2,
    }
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      canaryRatio: canary.canary_ratio,
      phase: canary.current_phase,
      status: canary.status,
      metrics: canary.metrics ? JSON.parse(canary.metrics) : mockMetrics,
      timestamp: new Date().toISOString(),
    }
  })
}))

// POST /api/deploys/canary/:id/auto-promote - 自动提升检查
router.post('/:id/auto-promote', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const canary = getOne('SELECT * FROM canary_deployments WHERE id = ?', [id])
  
  if (!canary) {
    return res.status(404).json({ code: 404, message: '金丝雀部署不存在' })
  }
  
  if (!canary.auto_promote) {
    return res.status(400).json({ code: 400, message: '未启用自动提升' })
  }
  
  // 获取当前指标
  const metrics = canary.metrics ? JSON.parse(canary.metrics) : null
  
  // 检查是否满足自动提升条件
  let canPromote = false
  let nextRatio = canary.canary_ratio
  
  if (metrics && metrics.comparison) {
    const conditions = canary.promote_conditions ? JSON.parse(canary.promote_conditions) : {}
    
    // 默认条件：错误率差异 < 1%，响应时间差异 < 50ms
    const errorRateThreshold = conditions.errorRateThreshold || 1
    const responseTimeThreshold = conditions.responseTimeThreshold || 50
    
    if (
      Math.abs(metrics.comparison.errorRateDiff) < errorRateThreshold &&
      Math.abs(metrics.comparison.responseTimeDiff) < responseTimeThreshold
    ) {
      canPromote = true
      // 计算下一个比例
      const ratioMap: Record<number, number> = { 10: 30, 30: 50, 50: 80, 80: 100 }
      nextRatio = ratioMap[canary.canary_ratio] || canary.canary_ratio
    }
  }
  
  if (canPromote && nextRatio <= 100) {
    // 自动提升比例
    runQuery(`
      UPDATE canary_deployments SET canary_ratio = ?, updated_at = datetime('now') WHERE id = ?
    `, [nextRatio, id])
    
    res.json({
      code: 200,
      message: `自动提升至 ${nextRatio}%`,
      data: { 
        canaryRatio: nextRatio,
        autoPromoted: true,
        metrics: metrics?.comparison
      }
    })
  } else {
    res.json({
      code: 200,
      message: '当前指标不满足自动提升条件',
      data: { 
        canaryRatio: canary.canary_ratio,
        autoPromoted: false,
        metrics: metrics?.comparison
      }
    })
  }
}))

// DELETE /api/deploys/canary/:id - 删除金丝雀部署记录
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const canary = getOne('SELECT id, status FROM canary_deployments WHERE id = ?', [id])
  if (!canary) {
    return res.status(404).json({ code: 404, message: '金丝雀部署不存在' })
  }
  
  if (canary.status === 'running') {
    return res.status(400).json({ code: 400, message: '任务正在执行中，无法删除' })
  }
  
  runQuery('DELETE FROM canary_deployments WHERE id = ?', [id])
  
  res.json({ code: 200, message: '删除成功' })
}))

export default router