// 应用API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/apps - 应用列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.keyword) {
    where += ' AND (app_name LIKE ? OR app_code LIKE ?)'
    const keyword = `%${req.query.keyword}%`
    params.push(keyword, keyword)
  }
  
  if (req.query.appType) {
    where += ' AND app_type = ?'
    params.push(req.query.appType)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM apps ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT a.id, a.app_name, a.app_code, a.app_type, a.repo_url, a.description,
           a.owner_id, a.created_at, a.updated_at,
           u.username as owner_name
    FROM apps a
    LEFT JOIN users u ON a.owner_id = u.id
    ${where}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(a => ({
        id: a.id,
        appName: a.app_name,
        appCode: a.app_code,
        appType: a.app_type,
        repoUrl: a.repo_url,
        description: a.description,
        ownerId: a.owner_id,
        ownerName: a.owner_name,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/apps/:id - 应用详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const app = getOne(`
    SELECT a.*, u.username as owner_name
    FROM apps a
    LEFT JOIN users u ON a.owner_id = u.id
    WHERE a.id = ?
  `, [id])
  
  if (!app) {
    return res.status(404).json({ code: 404, message: '应用不存在' })
  }
  
  // 解析JSON字段
  let configFiles: any = null
  let envVars: any = null
  
  if (app.config_files) {
    try { configFiles = JSON.parse(app.config_files) } catch {}
  }
  if (app.env_vars) {
    try { envVars = JSON.parse(app.env_vars) } catch {}
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: app.id,
      appName: app.app_name,
      appCode: app.app_code,
      appType: app.app_type,
      repoUrl: app.repo_url,
      dockerfile: app.dockerfile,
      configFiles,
      healthCheckPath: app.health_check_path,
      preScript: app.pre_script,
      postScript: app.post_script,
      envVars,
      description: app.description,
      ownerId: app.owner_id,
      ownerName: app.owner_name,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
    }
  })
}))

// POST /api/apps - 创建应用
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { 
    appName, appCode, appType, repoUrl, dockerfile, configFiles, 
    healthCheckPath, preScript, postScript, envVars, description, ownerId 
  } = req.body
  
  if (!appName || !appCode) {
    return res.status(400).json({ code: 400, message: '应用名称和代码不能为空' })
  }
  
  // 检查应用代码是否已存在
  const existing = getOne('SELECT id FROM apps WHERE app_code = ?', [appCode])
  if (existing) {
    return res.status(409).json({ code: 409, message: '应用代码已存在' })
  }
  
  runQuery(`
    INSERT INTO apps (app_name, app_code, app_type, repo_url, dockerfile, config_files,
                      health_check_path, pre_script, post_script, env_vars, description, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    appName, appCode, appType || 'docker', repoUrl || null, dockerfile || null,
    configFiles ? JSON.stringify(configFiles) : null, healthCheckPath || null,
    preScript || null, postScript || null, envVars ? JSON.stringify(envVars) : null,
    description || null, ownerId || null
  ])
  
  const id = getLastInsertRowId()
  
  res.json({ code: 200, message: '创建成功', data: { id } })
}))

// PUT /api/apps/:id - 更新应用
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const app = getOne('SELECT id FROM apps WHERE id = ?', [id])
  if (!app) {
    return res.status(404).json({ code: 404, message: '应用不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    appName: 'app_name', appType: 'app_type', repoUrl: 'repo_url',
    dockerfile: 'dockerfile', healthCheckPath: 'health_check_path',
    preScript: 'pre_script', postScript: 'post_script', description: 'description', ownerId: 'owner_id'
  }
  
  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      params.push(req.body[key])
    }
  }
  
  // 处理JSON字段
  if (req.body.configFiles !== undefined) {
    updates.push('config_files = ?')
    params.push(req.body.configFiles ? JSON.stringify(req.body.configFiles) : null)
  }
  if (req.body.envVars !== undefined) {
    updates.push('env_vars = ?')
    params.push(req.body.envVars ? JSON.stringify(req.body.envVars) : null)
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE apps SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/apps/:id - 删除应用
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM apps WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '应用不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

export default router