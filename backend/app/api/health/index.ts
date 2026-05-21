// 健康检查API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/health/checks - 健康检查配置列表
router.get('/checks', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.appId) {
    where += ' AND hc.app_id = ?'
    params.push(parseInt(req.query.appId as string))
  }
  if (req.query.checkType) {
    where += ' AND hc.check_type = ?'
    params.push(req.query.checkType)
  }
  if (req.query.status) {
    where += ' AND hc.status = ?'
    params.push(req.query.status)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM health_checks hc ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT hc.id, hc.app_id, hc.check_type, hc.check_target, hc.check_path,
           hc.check_port, hc.check_script, hc.timeout, hc.retry_times, hc.interval,
           hc.expected_resp, hc.status, hc.created_at, hc.updated_at,
           a.app_name, a.app_code
    FROM health_checks hc
    LEFT JOIN apps a ON hc.app_id = a.id
    ${where}
    ORDER BY hc.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(h => ({
        id: h.id,
        appId: h.app_id,
        appName: h.app_name,
        appCode: h.app_code,
        checkType: h.check_type,
        checkTarget: h.check_target,
        checkPath: h.check_path,
        checkPort: h.check_port,
        checkScript: h.check_script,
        timeout: h.timeout,
        retryTimes: h.retry_times,
        interval: h.interval,
        expectedResp: h.expected_resp,
        status: h.status,
        createdAt: h.created_at,
        updatedAt: h.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/health/checks/:id - 健康检查配置详情
router.get('/checks/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const check = getOne(`
    SELECT hc.*, a.app_name, a.app_code
    FROM health_checks hc
    LEFT JOIN apps a ON hc.app_id = a.id
    WHERE hc.id = ?
  `, [id])
  
  if (!check) {
    return res.status(404).json({ code: 404, message: '健康检查配置不存在' })
  }
  
  // 获取最近检查记录
  const records = getAll(`
    SELECT id, check_result, response_time, status_code, error_msg, check_data, checked_at
    FROM health_check_records
    WHERE check_id = ?
    ORDER BY checked_at DESC
    LIMIT 10
  `, [id])
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: check.id,
      appId: check.app_id,
      appName: check.app_name,
      appCode: check.app_code,
      checkType: check.check_type,
      checkTarget: check.check_target,
      checkPath: check.check_path,
      checkPort: check.check_port,
      checkScript: check.check_script,
      timeout: check.timeout,
      retryTimes: check.retry_times,
      interval: check.interval,
      expectedResp: check.expected_resp,
      status: check.status,
      createdAt: check.created_at,
      updatedAt: check.updated_at,
      recentRecords: records.map(r => ({
        id: r.id,
        checkResult: r.check_result,
        responseTime: r.response_time,
        statusCode: r.status_code,
        errorMsg: r.error_msg,
        checkData: r.check_data ? JSON.parse(r.check_data) : null,
        checkedAt: r.checked_at,
      }))
    }
  })
}))

// POST /api/health/checks - 创建健康检查配置
router.post('/checks', asyncHandler(async (req: Request, res: Response) => {
  const { 
    appId, checkType, checkTarget, checkPath, checkPort, 
    checkScript, timeout, retryTimes, interval, expectedResp 
  } = req.body
  
  if (!checkType || !checkTarget) {
    return res.status(400).json({ code: 400, message: '检查类型和检查目标不能为空' })
  }
  
  // 验证应用存在（如果提供了appId）
  if (appId) {
    const app = getOne('SELECT id FROM apps WHERE id = ?', [appId])
    if (!app) {
      return res.status(404).json({ code: 404, message: '应用不存在' })
    }
  }
  
  // 验证检查类型
  const validTypes = ['http', 'tcp', 'script']
  if (!validTypes.includes(checkType)) {
    return res.status(400).json({ 
      code: 400, 
      message: `检查类型必须是: ${validTypes.join(', ')}` 
    })
  }
  
  runQuery(`
    INSERT INTO health_checks (app_id, check_type, check_target, check_path, check_port,
      check_script, timeout, retry_times, interval, expected_resp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    appId || null, checkType, checkTarget, checkPath || null, checkPort || null,
    checkScript || null, timeout || 30, retryTimes || 3, interval || 10, expectedResp || null
  ])
  
  const id = getLastInsertRowId()
  
  res.json({ code: 200, message: '创建成功', data: { id } })
}))

// PUT /api/health/checks/:id - 更新健康检查配置
router.put('/checks/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const check = getOne('SELECT id FROM health_checks WHERE id = ?', [id])
  if (!check) {
    return res.status(404).json({ code: 404, message: '健康检查配置不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    checkType: 'check_type', checkTarget: 'check_target', checkPath: 'check_path',
    checkPort: 'check_port', checkScript: 'check_script', timeout: 'timeout',
    retryTimes: 'retry_times', interval: 'interval', expectedResp: 'expected_resp',
    status: 'status', appId: 'app_id'
  }
  
  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      params.push(req.body[key])
    }
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE health_checks SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/health/checks/:id - 删除健康检查配置
router.delete('/checks/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM health_checks WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '健康检查配置不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

// POST /api/health/checks/:id/execute - 手动执行健康检查
router.post('/checks/:id/execute', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const check = getOne('SELECT * FROM health_checks WHERE id = ?', [id])
  if (!check) {
    return res.status(404).json({ code: 404, message: '健康检查配置不存在' })
  }
  
  // 执行健康检查
  const result = await executeHealthCheck(check)
  
  // 记录检查结果
  runQuery(`
    INSERT INTO health_check_records (check_id, check_result, response_time, status_code, error_msg, check_data)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    id, result.healthy ? 'healthy' : 'unhealthy', result.responseTime || null,
    result.statusCode || null, result.errorMsg || null, result.checkData ? JSON.stringify(result.checkData) : null
  ])
  
  res.json({
    code: 200,
    message: result.healthy ? '健康检查通过' : '健康检查失败',
    data: result
  })
}))

// GET /api/health/checks/:id/records - 健康检查记录列表
router.get('/checks/:id/records', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { page, pageSize } = parsePagination(req.query)
  
  const totalResult = getOne('SELECT COUNT(*) as count FROM health_check_records WHERE check_id = ?', [id])
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const records = getAll(`
    SELECT id, check_result, response_time, status_code, error_msg, check_data, checked_at
    FROM health_check_records
    WHERE check_id = ?
    ORDER BY checked_at DESC
    LIMIT ? OFFSET ?
  `, [id, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      records.map(r => ({
        id: r.id,
        checkResult: r.check_result,
        responseTime: r.response_time,
        statusCode: r.status_code,
        errorMsg: r.error_msg,
        checkData: r.check_data ? JSON.parse(r.check_data) : null,
        checkedAt: r.checked_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// POST /api/health/checks/batch-execute - 批量执行健康检查
router.post('/checks/batch-execute', asyncHandler(async (req: Request, res: Response) => {
  const { checkIds } = req.body
  
  if (!checkIds || !Array.isArray(checkIds) || checkIds.length === 0) {
    return res.status(400).json({ code: 400, message: '检查ID列表不能为空' })
  }
  
  const results: any[] = []
  
  for (const checkId of checkIds) {
    const check = getOne('SELECT * FROM health_checks WHERE id = ?', [checkId])
    if (check) {
      const result = await executeHealthCheck(check)
      
      runQuery(`
        INSERT INTO health_check_records (check_id, check_result, response_time, status_code, error_msg, check_data)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        checkId, result.healthy ? 'healthy' : 'unhealthy', result.responseTime || null,
        result.statusCode || null, result.errorMsg || null, result.checkData ? JSON.stringify(result.checkData) : null
      ])
      
      results.push({ checkId, ...result })
    }
  }
  
  const healthyCount = results.filter(r => r.healthy).length
  const unhealthyCount = results.length - healthyCount
  
  res.json({
    code: 200,
    message: `执行完成: ${healthyCount} 通过, ${unhealthyCount} 失败`,
    data: {
      total: results.length,
      healthy: healthyCount,
      unhealthy: unhealthyCount,
      results
    }
  })
}))

// GET /api/health/checks/:id/statistics - 健康检查统计
router.get('/checks/:id/statistics', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  // 获取最近24小时记录
  const records = getAll(`
    SELECT check_result, response_time, checked_at
    FROM health_check_records
    WHERE check_id = ? AND checked_at >= datetime('now', '-24 hours')
    ORDER BY checked_at ASC
  `, [id])
  
  // 计算统计数据
  const healthyCount = records.filter(r => r.check_result === 'healthy').length
  const unhealthyCount = records.filter(r => r.check_result === 'unhealthy').length
  
  const responseTimes = records.filter(r => r.response_time).map(r => r.response_time)
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      checkId: id,
      period: '24h',
      total: records.length,
      healthy: healthyCount,
      unhealthy: unhealthyCount,
      healthyRate: records.length > 0 ? (healthyCount / records.length * 100).toFixed(2) + '%' : '0%',
      avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
      records: records.map(r => ({
        result: r.check_result,
        responseTime: r.response_time,
        timestamp: r.checked_at
      }))
    }
  })
}))

// 辅助函数：执行健康检查
async function executeHealthCheck(check: any): Promise<any> {
  const startTime = Date.now()
  
  try {
    let result: any = { healthy: true }
    
    switch (check.check_type) {
      case 'http':
        // 模拟HTTP健康检查
        result = await httpHealthCheck(check.check_target, check.check_path, check.timeout, check.expected_resp)
        break
      case 'tcp':
        // 模拟TCP端口检查
        result = await tcpHealthCheck(check.check_target, check.check_port, check.timeout)
        break
      case 'script':
        // 模拟脚本检查
        result = await scriptHealthCheck(check.check_script, check.timeout)
        break
    }
    
    const responseTime = Date.now() - startTime
    
    return {
      healthy: result.healthy,
      responseTime,
      statusCode: result.statusCode,
      errorMsg: result.errorMsg,
      checkData: result.data
    }
  } catch (error: any) {
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      errorMsg: error.message || '检查执行失败'
    }
  }
}

// HTTP健康检查模拟
async function httpHealthCheck(target: string, path: string, timeout: number, expectedResp: string): Promise<any> {
  // 模拟HTTP检查
  const statusCode = Math.random() > 0.1 ? 200 : 500
  const healthy = statusCode === 200
  
  return {
    healthy,
    statusCode,
    data: {
      target,
      path,
      status: statusCode === 200 ? 'OK' : 'ERROR'
    }
  }
}

// TCP健康检查模拟
async function tcpHealthCheck(target: string, port: number, timeout: number): Promise<any> {
  // 模拟TCP检查
  const healthy = Math.random() > 0.1
  
  return {
    healthy,
    data: {
      target,
      port,
      connected: healthy
    }
  }
}

// 脚本健康检查模拟
async function scriptHealthCheck(script: string, timeout: number): Promise<any> {
  // 模拟脚本检查
  const healthy = Math.random() > 0.2
  const output = healthy ? 'Script executed successfully' : 'Script execution failed'
  
  return {
    healthy,
    data: {
      output,
      exitCode: healthy ? 0 : 1
    }
  }
}

export default router