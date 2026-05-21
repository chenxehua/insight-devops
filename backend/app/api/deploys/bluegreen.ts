// 蓝绿部署API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'

const router = Router()

router.use(authMiddleware)

// GET /api/deploys/bluegreen - 蓝绿部署列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, pageSize = 10 } = req.query
  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string)
  
  const list = getAll(`
    SELECT bgd.id, bgd.deploy_task_id, bgd.blue_env, bgd.green_env, bgd.traffic_ratio,
           bgd.observation_time, bgd.current_phase, bgd.status, bgd.switch_at,
           bgd.completed_at, bgd.metrics, bgd.created_at, bgd.updated_at,
           dt.environment, dt.version, dt.status as deploy_status,
           a.app_name, a.app_code
    FROM blue_green_deployments bgd
    INNER JOIN deploy_tasks dt ON bgd.deploy_task_id = dt.id
    INNER JOIN apps a ON dt.app_id = a.id
    ORDER BY bgd.created_at DESC
    LIMIT ? OFFSET ?
  `, [parseInt(pageSize as string), offset])
  
  const totalResult = getOne('SELECT COUNT(*) as count FROM blue_green_deployments')
  const total = totalResult?.count || 0
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      list: list.map(b => ({
        id: b.id,
        deployTaskId: b.deploy_task_id,
        blueEnv: b.blue_env,
        greenEnv: b.green_env,
        trafficRatio: b.traffic_ratio,
        observationTime: b.observation_time,
        currentPhase: b.current_phase,
        status: b.status,
        switchAt: b.switch_at,
        completedAt: b.completed_at,
        metrics: b.metrics ? JSON.parse(b.metrics) : null,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
        environment: b.environment,
        version: b.version,
        appName: b.app_name,
        appCode: b.app_code,
      })),
      total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string)
    }
  })
}))

// GET /api/deploys/bluegreen/:id - 蓝绿部署详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const bg = getOne(`
    SELECT bgd.*, dt.app_id, dt.environment, dt.version, dt.status as deploy_status,
           a.app_name, a.app_code, a.dockerfile, a.config_files
    FROM blue_green_deployments bgd
    INNER JOIN deploy_tasks dt ON bgd.deploy_task_id = dt.id
    INNER JOIN apps a ON dt.app_id = a.id
    WHERE bgd.id = ?
  `, [id])
  
  if (!bg) {
    return res.status(404).json({ code: 404, message: '蓝绿部署不存在' })
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: bg.id,
      deployTaskId: bg.deploy_task_id,
      appId: bg.app_id,
      appName: bg.app_name,
      appCode: bg.app_code,
      environment: bg.environment,
      version: bg.version,
      blueEnv: bg.blue_env,
      greenEnv: bg.green_env,
      trafficRatio: bg.traffic_ratio,
      observationTime: bg.observation_time,
      currentPhase: bg.current_phase,
      status: bg.status,
      switchAt: bg.switch_at,
      completedAt: bg.completed_at,
      metrics: bg.metrics ? JSON.parse(bg.metrics) : null,
      createdAt: bg.created_at,
      updatedAt: bg.updated_at,
    }
  })
}))

// POST /api/deploys/bluegreen - 创建蓝绿部署
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { deployTaskId, blueEnv, greenEnv, trafficRatio, observationTime } = req.body
  
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
    UPDATE deploy_tasks SET strategy = 'blue_green', updated_at = datetime('now') WHERE id = ?
  `, [deployTaskId])
  
  // 创建蓝绿部署记录
  runQuery(`
    INSERT INTO blue_green_deployments (deploy_task_id, blue_env, green_env, traffic_ratio, observation_time)
    VALUES (?, ?, ?, ?, ?)
  `, [
    deployTaskId,
    blueEnv || 'blue',
    greenEnv || 'green',
    trafficRatio || 0,
    observationTime || 15
  ])
  
  const id = getLastInsertRowId()
  
  res.json({ code: 200, message: '蓝绿部署创建成功', data: { id } })
}))

// PUT /api/deploys/bluegreen/:id - 更新蓝绿部署
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const bg = getOne('SELECT id FROM blue_green_deployments WHERE id = ?', [id])
  if (!bg) {
    return res.status(404).json({ code: 404, message: '蓝绿部署不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    trafficRatio: 'traffic_ratio', currentPhase: 'current_phase', status: 'status'
  }
  
  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      params.push(req.body[key])
    }
  }
  
  if (req.body.metrics !== undefined) {
    updates.push('metrics = ?')
    params.push(JSON.stringify(req.body.metrics))
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE blue_green_deployments SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// POST /api/deploys/bluegreen/:id/switch - 流量切换
router.post('/:id/switch', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { trafficRatio } = req.body
  
  const bg = getOne(`
    SELECT id, current_phase, status, traffic_ratio 
    FROM blue_green_deployments WHERE id = ?
  `, [id])
  
  if (!bg) {
    return res.status(404).json({ code: 404, message: '蓝绿部署不存在' })
  }
  
  if (bg.current_phase !== 'observing' && bg.current_phase !== 'switching') {
    return res.status(400).json({ 
      code: 400, 
      message: '当前阶段不允许流量切换，请先完成观察期' 
    })
  }
  
  const ratio = trafficRatio !== undefined ? trafficRatio : 100
  
  runQuery(`
    UPDATE blue_green_deployments SET 
      traffic_ratio = ?,
      current_phase = 'switching',
      switch_at = CASE WHEN ? > 0 THEN datetime('now') ELSE NULL END,
      updated_at = datetime('now')
    WHERE id = ?
  `, [ratio, ratio, id])
  
  res.json({ 
    code: 200, 
    message: ratio >= 100 ? '流量已完全切换到绿间' : `流量切换比例: ${ratio}%` 
  })
}))

// POST /api/deploys/bluegreen/:id/rollback - 蓝绿回滚
router.post('/:id/rollback', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const bg = getOne('SELECT id, status, deploy_task_id FROM blue_green_deployments WHERE id = ?', [id])
  if (!bg) {
    return res.status(404).json({ code: 404, message: '蓝绿部署不存在' })
  }
  
  if (bg.status === 'rolled_back') {
    return res.status(400).json({ code: 400, message: '已回滚，无需重复操作' })
  }
  
  // 更新蓝绿部署状态
  runQuery(`
    UPDATE blue_green_deployments SET 
      status = 'rolled_back', 
      current_phase = 'failed',
      updated_at = datetime('now')
    WHERE id = ?
  `, [id])
  
  // 更新部署任务状态
  runQuery(`
    UPDATE deploy_tasks SET status = 'rollback', updated_at = datetime('now') WHERE id = ?
  `, [bg.deploy_task_id])
  
  res.json({ code: 200, message: '蓝绿回滚已触发，流量切回蓝间' })
}))

// POST /api/deploys/bluegreen/:id/complete - 完成蓝绿部署
router.post('/:id/complete', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const bg = getOne('SELECT id, status, traffic_ratio FROM blue_green_deployments WHERE id = ?', [id])
  if (!bg) {
    return res.status(404).json({ code: 404, message: '蓝绿部署不存在' })
  }
  
  if (bg.status !== 'running') {
    return res.status(400).json({ code: 400, message: '任务不在运行状态' })
  }
  
  if (bg.traffic_ratio < 100) {
    return res.status(400).json({ code: 400, message: '请先将流量完全切换到绿间' })
  }
  
  // 完成蓝绿部署
  runQuery(`
    UPDATE blue_green_deployments SET 
      status = 'success', 
      current_phase = 'completed',
      completed_at = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ?
  `, [id])
  
  res.json({ code: 200, message: '蓝绿部署已完成' })
}))

// GET /api/deploys/bluegreen/:id/metrics - 获取蓝绿部署指标
router.get('/:id/metrics', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const bg = getOne(`
    SELECT metrics, current_phase, traffic_ratio, status
    FROM blue_green_deployments WHERE id = ?
  `, [id])
  
  if (!bg) {
    return res.status(404).json({ code: 404, message: '蓝绿部署不存在' })
  }
  
  // 返回模拟的监控指标（实际场景从监控系统获取）
  const mockMetrics = {
    blue: {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      requestCount: Math.floor(Math.random() * 1000),
      errorRate: Math.random() * 5,
      avgResponseTime: Math.random() * 500,
    },
    green: {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      requestCount: Math.floor(Math.random() * 1000),
      errorRate: Math.random() * 5,
      avgResponseTime: Math.random() * 500,
    },
    comparison: {
      cpuDiff: (Math.random() - 0.5) * 20,
      memoryDiff: (Math.random() - 0.5) * 20,
      responseTimeDiff: (Math.random() - 0.5) * 200,
      errorRateDiff: (Math.random() - 0.5) * 2,
    }
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      phase: bg.current_phase,
      trafficRatio: bg.traffic_ratio,
      status: bg.status,
      metrics: bg.metrics ? JSON.parse(bg.metrics) : mockMetrics,
      timestamp: new Date().toISOString(),
    }
  })
}))

// POST /api/deploys/bluegreen/:id/verify - 验证绿间健康
router.post('/:id/verify', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const bg = getOne('SELECT id, deploy_task_id, current_phase FROM blue_green_deployments WHERE id = ?', [id])
  if (!bg) {
    return res.status(404).json({ code: 404, message: '蓝绿部署不存在' })
  }
  
  // 更新阶段为验证中
  runQuery(`
    UPDATE blue_green_deployments SET 
      current_phase = 'verifying',
      updated_at = datetime('now')
    WHERE id = ?
  `, [id])
  
  // 模拟验证过程（实际场景执行健康检查）
  // 验证通过后更新阶段为观察期
  setTimeout(() => {
    runQuery(`
      UPDATE blue_green_deployments SET 
        current_phase = 'observing',
        updated_at = datetime('now')
      WHERE id = ?
    `, [id])
  }, 1000)
  
  res.json({ 
    code: 200, 
    message: '绿间健康检查已启动',
    data: { phase: 'verifying' }
  })
}))

// DELETE /api/deploys/bluegreen/:id - 删除蓝绿部署记录
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const bg = getOne('SELECT id, status FROM blue_green_deployments WHERE id = ?', [id])
  if (!bg) {
    return res.status(404).json({ code: 404, message: '蓝绿部署不存在' })
  }
  
  if (bg.status === 'running') {
    return res.status(400).json({ code: 400, message: '任务正在执行中，无法删除' })
  }
  
  runQuery('DELETE FROM blue_green_deployments WHERE id = ?', [id])
  
  res.json({ code: 200, message: '删除成功' })
}))

export default router