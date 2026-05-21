// 配置API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/configs - 配置列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.keyword) {
    where += ' AND (config_name LIKE ? OR config_key LIKE ?)'
    const keyword = `%${req.query.keyword}%`
    params.push(keyword, keyword)
  }
  if (req.query.appId) {
    where += ' AND c.app_id = ?'
    params.push(parseInt(req.query.appId as string))
  }
  if (req.query.environment) {
    where += ' AND c.environment = ?'
    params.push(req.query.environment)
  }
  if (req.query.configType) {
    where += ' AND c.config_type = ?'
    params.push(req.query.configType)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM configs c ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT c.id, c.config_name, c.config_key, c.app_id, c.environment, c.config_type,
           c.version, c.description, c.created_at, c.updated_at,
           a.app_name
    FROM configs c
    LEFT JOIN apps a ON c.app_id = a.id
    ${where}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(c => ({
        id: c.id,
        configName: c.config_name,
        configKey: c.config_key,
        appId: c.app_id,
        appName: c.app_name,
        environment: c.environment,
        configType: c.config_type,
        version: c.version,
        description: c.description,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/configs/:id - 配置详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const config = getOne(`
    SELECT c.*, a.app_name
    FROM configs c
    LEFT JOIN apps a ON c.app_id = a.id
    WHERE c.id = ?
  `, [id])
  
  if (!config) {
    return res.status(404).json({ code: 404, message: '配置不存在' })
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: config.id,
      configName: config.config_name,
      configKey: config.config_key,
      appId: config.app_id,
      appName: config.app_name,
      environment: config.environment,
      configType: config.config_type,
      configValue: config.config_value,
      version: config.version,
      description: config.description,
      createdAt: config.created_at,
      updatedAt: config.updated_at,
    }
  })
}))

// POST /api/configs - 创建配置
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { configName, configKey, appId, environment, configType, configValue, description } = req.body
  
  if (!configName || !configKey) {
    return res.status(400).json({ code: 400, message: '配置名称和键不能为空' })
  }
  
  // 检查配置键是否已存在
  const existing = getOne(`
    SELECT id FROM configs 
    WHERE config_key = ? AND (app_id = ? OR (app_id IS NULL AND ? IS NULL)) 
    AND (environment = ? OR (environment IS NULL AND ? IS NULL))
  `, [configKey, appId || null, appId || null, environment || null, environment || null])
  
  if (existing) {
    return res.status(409).json({ code: 409, message: '配置键已存在' })
  }
  
  runQuery(`
    INSERT INTO configs (config_name, config_key, app_id, environment, config_type, config_value, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    configName, configKey, appId || null, environment || null,
    configType || 'key-value', configValue || null, description || null
  ])
  
  // 获取刚插入的配置ID
  const insertedConfig = getOne('SELECT id FROM configs WHERE config_key = ? ORDER BY id DESC', [configKey])
  const configId = insertedConfig?.id || 0
  
  // 创建初始版本
  runQuery(`
    INSERT INTO config_versions (config_id, version, config_value)
    VALUES (?, 1, ?)
  `, [configId, configValue || ''])
  
  res.json({ code: 200, message: '创建成功', data: { id: configId } })
}))

// PUT /api/configs/:id - 更新配置
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const config = getOne('SELECT id, version FROM configs WHERE id = ?', [id])
  if (!config) {
    return res.status(404).json({ code: 404, message: '配置不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    configName: 'config_name', configType: 'config_type', description: 'description'
  }
  
  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      params.push(req.body[key])
    }
  }
  
  // 处理配置值更新，增加版本号
  if (req.body.configValue !== undefined) {
    updates.push('config_value = ?')
    params.push(req.body.configValue)
    updates.push('version = ?')
    params.push(config.version + 1)
    
    // 记录版本历史
    runQuery(`
      INSERT INTO config_versions (config_id, version, config_value, change_note, created_by)
      VALUES (?, ?, ?, ?, ?)
    `, [id, config.version + 1, req.body.configValue, req.body.changeNote || null, req.body.createdBy || null])
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE configs SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/configs/:id - 删除配置
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM configs WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '配置不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

// GET /api/configs/:id/versions - 配置版本历史
router.get('/:id/versions', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const versions = getAll(`
    SELECT cv.id, cv.version, cv.config_value, cv.change_note, cv.created_at,
           u.username as created_by_name
    FROM config_versions cv
    LEFT JOIN users u ON cv.created_by = u.id
    WHERE cv.config_id = ?
    ORDER BY cv.version DESC
  `, [id])
  
  res.json({
    code: 200,
    message: 'success',
    data: versions.map(v => ({
      id: v.id,
      version: v.version,
      configValue: v.config_value,
      changeNote: v.change_note,
      createdAt: v.created_at,
      createdByName: v.created_by_name,
    }))
  })
}))

export default router