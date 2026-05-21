// 备份API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// 数据库列表
router.get('/databases', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.keyword) {
    where += ' AND (db_name LIKE ? OR host LIKE ?)'
    const keyword = `%${req.query.keyword}%`
    params.push(keyword, keyword)
  }
  if (req.query.dbType) {
    where += ' AND db_type = ?'
    params.push(req.query.dbType)
  }
  if (req.query.status) {
    where += ' AND status = ?'
    params.push(parseInt(req.query.status as string))
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM databases ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT id, db_name, db_type, host, port, username, description, status, created_at, updated_at
    FROM databases
    ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(d => ({
        id: d.id,
        dbName: d.db_name,
        dbType: d.db_type,
        host: d.host,
        port: d.port,
        username: d.username,
        description: d.description,
        status: d.status,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// 创建数据库
router.post('/databases', asyncHandler(async (req: Request, res: Response) => {
  const { dbName, dbType, host, port, username, password, description } = req.body
  
  if (!dbName || !dbType || !host || !port) {
    return res.status(400).json({ code: 400, message: '数据库名称、类型、主机和端口不能为空' })
  }
  
  runQuery(`
    INSERT INTO databases (db_name, db_type, host, port, username, password, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    dbName, dbType, host, port, username || null,
    password ? Buffer.from(password).toString('base64') : null, description || null
  ])
  
  const dbId = getLastInsertRowId()
  
  res.json({ code: 200, message: '创建成功', data: { id: dbId } })
}))

// 更新数据库
router.put('/databases/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const database = getOne('SELECT id FROM databases WHERE id = ?', [id])
  if (!database) {
    return res.status(404).json({ code: 404, message: '数据库不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    dbName: 'db_name', dbType: 'db_type', host: 'host', port: 'port',
    username: 'username', description: 'description', status: 'status'
  }
  
  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      params.push(req.body[key])
    }
  }
  
  if (req.body.password !== undefined) {
    updates.push('password = ?')
    params.push(req.body.password ? Buffer.from(req.body.password).toString('base64') : null)
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE databases SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// 删除数据库
router.delete('/databases/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM databases WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '数据库不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

// 备份记录列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.databaseId) {
    where += ' AND b.database_id = ?'
    params.push(parseInt(req.query.databaseId as string))
  }
  if (req.query.backupType) {
    where += ' AND b.backup_type = ?'
    params.push(req.query.backupType)
  }
  if (req.query.status) {
    where += ' AND b.status = ?'
    params.push(req.query.status)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM backups b ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT b.id, b.database_id, b.backup_type, b.backup_path, b.backup_size, b.status,
           b.started_at, b.finished_at, b.error_message, b.created_at,
           d.db_name, d.db_type
    FROM backups b
    INNER JOIN databases d ON b.database_id = d.id
    ${where}
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(b => ({
        id: b.id,
        databaseId: b.database_id,
        dbName: b.db_name,
        dbType: b.db_type,
        backupType: b.backup_type,
        backupPath: b.backup_path,
        backupSize: b.backup_size,
        status: b.status,
        startedAt: b.started_at,
        finishedAt: b.finished_at,
        errorMessage: b.error_message,
        createdAt: b.created_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// 备份记录详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const backup = getOne(`
    SELECT b.*, d.db_name, d.db_type
    FROM backups b
    INNER JOIN databases d ON b.database_id = d.id
    WHERE b.id = ?
  `, [id])
  
  if (!backup) {
    return res.status(404).json({ code: 404, message: '备份记录不存在' })
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: backup.id,
      databaseId: backup.database_id,
      dbName: backup.db_name,
      dbType: backup.db_type,
      backupType: backup.backup_type,
      backupPath: backup.backup_path,
      backupSize: backup.backup_size,
      status: backup.status,
      startedAt: backup.started_at,
      finishedAt: backup.finished_at,
      errorMessage: backup.error_message,
      createdAt: backup.created_at,
    }
  })
}))

// 创建备份
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { databaseId, backupType } = req.body
  
  if (!databaseId || !backupType) {
    return res.status(400).json({ code: 400, message: '数据库ID和备份类型不能为空' })
  }
  
  // 检查数据库是否存在
  const database = getOne('SELECT id FROM databases WHERE id = ?', [databaseId])
  if (!database) {
    return res.status(404).json({ code: 404, message: '数据库不存在' })
  }
  
  runQuery(`
    INSERT INTO backups (database_id, backup_type, status)
    VALUES (?, ?, 'pending')
  `, [databaseId, backupType])
  
  const backupId = getLastInsertRowId()
  
  res.json({ code: 200, message: '备份任务已创建', data: { id: backupId } })
}))

// 更新备份状态
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const backup = getOne('SELECT id FROM backups WHERE id = ?', [id])
  if (!backup) {
    return res.status(404).json({ code: 404, message: '备份记录不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    status: 'status', backupPath: 'backup_path', backupSize: 'backup_size',
    errorMessage: 'error_message'
  }
  
  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      params.push(req.body[key])
    }
  }
  
  if (req.body.startedAt !== undefined) {
    updates.push('started_at = ?')
    params.push(req.body.startedAt ? new Date().toISOString() : null)
  }
  if (req.body.finishedAt !== undefined) {
    updates.push('finished_at = ?')
    params.push(req.body.finishedAt ? new Date().toISOString() : null)
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE backups SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// 删除备份记录
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM backups WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '备份记录不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

// POST /api/backups/:id/restore - 恢复备份
router.post('/:id/restore', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const backup = getOne(`
    SELECT b.*, d.db_name, d.db_type, d.host, d.port
    FROM backups b
    INNER JOIN databases d ON b.database_id = d.id
    WHERE b.id = ?
  `, [id])
  
  if (!backup) {
    return res.status(404).json({ code: 404, message: '备份记录不存在' })
  }
  
  if (backup.status !== 'success') {
    return res.status(400).json({ code: 400, message: '只能恢复成功的备份' })
  }
  
  if (!backup.backup_path) {
    return res.status(400).json({ code: 400, message: '备份文件路径不存在' })
  }
  
  // 创建恢复记录
  runQuery(`
    INSERT INTO backups (database_id, backup_type, status)
    VALUES (?, 'restore', 'restoring')
  `, [backup.database_id])
  
  const restoreId = getLastInsertRowId()
  
  // 模拟恢复操作（实际场景中应该执行实际的恢复命令）
  res.json({
    code: 200,
    message: '恢复任务已启动',
    data: {
      restoreId,
      databaseName: backup.db_name,
      backupPath: backup.backup_path,
    }
  })
}))

export default router