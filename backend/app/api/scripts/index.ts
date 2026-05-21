// 脚本API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/scripts - 脚本列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.keyword) {
    where += ' AND (script_name LIKE ? OR script_code LIKE ?)'
    const keyword = `%${req.query.keyword}%`
    params.push(keyword, keyword)
  }
  if (req.query.scriptType) {
    where += ' AND script_type = ?'
    params.push(req.query.scriptType)
  }
  if (req.query.category) {
    where += ' AND category = ?'
    params.push(req.query.category)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM scripts ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT s.id, s.script_name, s.script_code, s.script_type, s.category, s.tags,
           s.version, s.description, s.owner_id, s.created_at, s.updated_at,
           u.username as owner_name
    FROM scripts s
    LEFT JOIN users u ON s.owner_id = u.id
    ${where}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(s => ({
        id: s.id,
        scriptName: s.script_name,
        scriptCode: s.script_code,
        scriptType: s.script_type,
        category: s.category,
        tags: s.tags ? s.tags.split(',') : [],
        version: s.version,
        description: s.description,
        ownerId: s.owner_id,
        ownerName: s.owner_name,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/scripts/:id - 脚本详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const script = getOne(`
    SELECT s.*, u.username as owner_name
    FROM scripts s
    LEFT JOIN users u ON s.owner_id = u.id
    WHERE s.id = ?
  `, [id])
  
  if (!script) {
    return res.status(404).json({ code: 404, message: '脚本不存在' })
  }
  
  // 解析params JSON
  let params: any = null
  if (script.params) {
    try { params = JSON.parse(script.params) } catch {}
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: script.id,
      scriptName: script.script_name,
      scriptCode: script.script_code,
      scriptType: script.script_type,
      content: script.content,
      params,
      category: script.category,
      tags: script.tags ? script.tags.split(',') : [],
      version: script.version,
      description: script.description,
      ownerId: script.owner_id,
      ownerName: script.owner_name,
      createdAt: script.created_at,
      updatedAt: script.updated_at,
    }
  })
}))

// POST /api/scripts - 创建脚本
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { scriptName, scriptCode, scriptType, content, params, category, tags, description, ownerId } = req.body
  
  if (!scriptName || !scriptCode || !scriptType || !content) {
    return res.status(400).json({ code: 400, message: '脚本名称、代码、类型和内容不能为空' })
  }
  
  // 检查脚本代码是否已存在
  const existing = getOne('SELECT id FROM scripts WHERE script_code = ?', [scriptCode])
  if (existing) {
    return res.status(409).json({ code: 409, message: '脚本代码已存在' })
  }
  
  runQuery(`
    INSERT INTO scripts (script_name, script_code, script_type, content, params, category, tags, description, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    scriptName, scriptCode, scriptType, content,
    params ? JSON.stringify(params) : null,
    category || null, tags ? (Array.isArray(tags) ? tags.join(',') : tags) : null,
    description || null, ownerId || null
  ])
  
  // 获取刚插入的脚本ID
  const insertedScript = getOne('SELECT id FROM scripts WHERE script_code = ?', [scriptCode])
  const scriptId = insertedScript?.id || 0
  
  // 创建初始版本
  runQuery(`
    INSERT INTO script_versions (script_id, version, content, created_by)
    VALUES (?, 1, ?, ?)
  `, [scriptId, content, ownerId || null])
  
  res.json({ code: 200, message: '创建成功', data: { id: scriptId } })
}))

// PUT /api/scripts/:id - 更新脚本
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const script = getOne('SELECT id, version FROM scripts WHERE id = ?', [id])
  if (!script) {
    return res.status(404).json({ code: 404, message: '脚本不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    scriptName: 'script_name', scriptType: 'script_type',
    category: 'category', description: 'description', ownerId: 'owner_id'
  }
  
  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      params.push(req.body[key])
    }
  }
  
  // 处理内容更新，增加版本号
  if (req.body.content !== undefined) {
    updates.push('content = ?')
    params.push(req.body.content)
    updates.push('version = ?')
    params.push(script.version + 1)
    
    // 记录版本历史
    runQuery(`
      INSERT INTO script_versions (script_id, version, content, change_note, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [id, script.version + 1, req.body.content, req.body.changeNote || null, req.body.ownerId || null])
  }
  
  // 处理JSON字段
  if (req.body.params !== undefined) {
    updates.push('params = ?')
    params.push(req.body.params ? JSON.stringify(req.body.params) : null)
  }
  if (req.body.tags !== undefined) {
    updates.push('tags = ?')
    params.push(Array.isArray(req.body.tags) ? req.body.tags.join(',') : req.body.tags)
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE scripts SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/scripts/:id - 删除脚本
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM scripts WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '脚本不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

// GET /api/scripts/:id/versions - 脚本版本历史
router.get('/:id/versions', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const versions = getAll(`
    SELECT sv.id, sv.version, sv.change_note, sv.created_at,
           u.username as created_by_name
    FROM script_versions sv
    LEFT JOIN users u ON sv.created_by = u.id
    WHERE sv.script_id = ?
    ORDER BY sv.version DESC
  `, [id])
  
  res.json({
    code: 200,
    message: 'success',
    data: versions.map(v => ({
      id: v.id,
      version: v.version,
      changeNote: v.change_note,
      createdAt: v.created_at,
      createdByName: v.created_by_name,
    }))
  })
}))

// POST /api/scripts/:id/execute - 执行脚本
router.post('/:id/execute', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { params, targetHost } = req.body
  
  const script = getOne('SELECT id, script_name FROM scripts WHERE id = ?', [id])
  if (!script) {
    return res.status(404).json({ code: 404, message: '脚本不存在' })
  }
  
  // 创建执行记录
  runQuery(`
    INSERT INTO script_executions (script_id, params, target_host, status)
    VALUES (?, ?, ?, 'pending')
  `, [id, params ? JSON.stringify(params) : null, targetHost || null])
  
  // 获取刚插入的执行记录ID
  const insertedExec = getOne('SELECT id FROM script_executions WHERE script_id = ? ORDER BY id DESC', [id])
  const execId = insertedExec?.id || 0
  
  res.json({ code: 200, message: '脚本执行任务已创建', data: { id: execId } })
}))

// GET /api/scripts/executions/:id - 执行结果详情 (单独路由，需放在 /:id 路由之前)
router.get('/executions/:id', asyncHandler(async (req: Request, res: Response) => {
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

// GET /api/scripts/:id/executions - 脚本执行记录
router.get('/:id/executions', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { page, pageSize } = parsePagination(req.query)
  
  const totalResult = getOne('SELECT COUNT(*) as count FROM script_executions WHERE script_id = ?', [id])
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const executions = getAll(`
    SELECT id, params, target_host, status, output, error_output, 
           started_at, finished_at, created_at
    FROM script_executions
    WHERE script_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [id, pageSize, offset])
  
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

export default router