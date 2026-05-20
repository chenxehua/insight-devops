// 故障API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/faults - 故障列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.status) {
    where += ' AND f.status = ?'
    params.push(req.query.status)
  }
  if (req.query.faultLevel) {
    where += ' AND f.fault_level = ?'
    params.push(req.query.faultLevel)
  }
  if (req.query.keyword) {
    where += ' AND fault_title LIKE ?'
    params.push(`%${req.query.keyword}%`)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM faults f ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT f.id, f.fault_title, f.fault_level, f.fault_type, f.target_type, f.target_id,
           f.root_cause, f.solution, f.status, f.handler_id, f.occurred_at, f.detected_at,
           f.resolved_at, f.created_at, f.updated_at,
           u.username as handler_name
    FROM faults f
    LEFT JOIN users u ON f.handler_id = u.id
    ${where}
    ORDER BY f.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(f => ({
        id: f.id,
        faultTitle: f.fault_title,
        faultLevel: f.fault_level,
        faultType: f.fault_type,
        targetType: f.target_type,
        targetId: f.target_id,
        rootCause: f.root_cause,
        solution: f.solution,
        status: f.status,
        handlerId: f.handler_id,
        handlerName: f.handler_name,
        occurredAt: f.occurred_at,
        detectedAt: f.detected_at,
        resolvedAt: f.resolved_at,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/faults/:id - 故障详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const fault = getOne(`
    SELECT f.*, u.username as handler_name
    FROM faults f
    LEFT JOIN users u ON f.handler_id = u.id
    WHERE f.id = ?
  `, [id])
  
  if (!fault) {
    return res.status(404).json({ code: 404, message: '故障不存在' })
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: fault.id,
      faultTitle: fault.fault_title,
      faultLevel: fault.fault_level,
      faultType: fault.fault_type,
      targetType: fault.target_type,
      targetId: fault.target_id,
      rootCause: fault.root_cause,
      solution: fault.solution,
      status: fault.status,
      handlerId: fault.handler_id,
      handlerName: fault.handler_name,
      occurredAt: fault.occurred_at,
      detectedAt: fault.detected_at,
      resolvedAt: fault.resolved_at,
      createdAt: fault.created_at,
      updatedAt: fault.updated_at,
    }
  })
}))

// POST /api/faults - 创建故障
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { faultTitle, faultLevel, faultType, targetType, targetId, occurredAt, detectedAt, handlerId } = req.body
  
  if (!faultTitle || !faultLevel) {
    return res.status(400).json({ code: 400, message: '故障标题和级别不能为空' })
  }
  
  runQuery(`
    INSERT INTO faults (fault_title, fault_level, fault_type, target_type, target_id, occurred_at, detected_at, handler_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    faultTitle, faultLevel, faultType || null, targetType || null, targetId || null,
    occurredAt || null, detectedAt || null, handlerId || null
  ])
  
  const faultId = getLastInsertRowId()
  
  res.json({ code: 200, message: '创建成功', data: { id: faultId } })
}))

// PUT /api/faults/:id - 更新故障
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const fault = getOne('SELECT id FROM faults WHERE id = ?', [id])
  if (!fault) {
    return res.status(404).json({ code: 404, message: '故障不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    faultTitle: 'fault_title', faultLevel: 'fault_level', faultType: 'fault_type',
    targetType: 'target_type', targetId: 'target_id', rootCause: 'root_cause',
    solution: 'solution', status: 'status', handlerId: 'handler_id'
  }
  
  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      params.push(req.body[key])
    }
  }
  
  // 处理时间字段
  if (req.body.occurredAt !== undefined) {
    updates.push('occurred_at = ?')
    params.push(req.body.occurredAt || null)
  }
  if (req.body.detectedAt !== undefined) {
    updates.push('detected_at = ?')
    params.push(req.body.detectedAt || null)
  }
  if (req.body.resolvedAt !== undefined) {
    updates.push('resolved_at = ?')
    params.push(req.body.resolvedAt || null)
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE faults SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/faults/:id - 删除故障
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM faults WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '故障不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

export default router