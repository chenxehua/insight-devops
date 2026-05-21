// 脚本执行结果路由 - 必须放在 scripts 路由之前
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne } from '../../lib/database'

const router = Router()
router.use(authMiddleware)

// GET /api/scripts/executions/:id - 执行结果详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const execution = getOne(`
    SELECT se.*, s.script_name, s.script_code
    FROM script_executions se
    INNER JOIN scripts s ON se.script_id = s.id
    WHERE se.id = ?
  `, [id])
  
  if (!execution) {
    return res.status(404).json({ code: 404, message: '执行记录不存在' })
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: execution.id,
      scriptId: execution.script_id,
      scriptName: execution.script_name,
      scriptCode: execution.script_code,
      params: execution.params ? JSON.parse(execution.params) : null,
      targetHost: execution.target_host,
      status: execution.status,
      output: execution.output,
      errorOutput: execution.error_output,
      startedAt: execution.started_at,
      finishedAt: execution.finished_at,
      createdAt: execution.created_at,
    }
  })
}))

export default router