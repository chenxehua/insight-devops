// 配置版本路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery } from '../../lib/database'

const router = Router()
router.use(authMiddleware)

// GET /api/configs/:id/versions - 配置版本历史
router.get('/:id/versions', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const config = getOne('SELECT id, config_name FROM configs WHERE id = ?', [id])
  if (!config) {
    return res.status(404).json({ code: 404, message: '配置不存在' })
  }
  
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

// POST /api/configs/:id/rollback - 配置回滚
router.post('/:id/rollback', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { targetVersion } = req.body
  
  if (!targetVersion) {
    return res.status(400).json({ code: 400, message: '目标版本不能为空' })
  }
  
  const config = getOne('SELECT id, version FROM configs WHERE id = ?', [id])
  if (!config) {
    return res.status(404).json({ code: 404, message: '配置不存在' })
  }
  
  // 获取目标版本的内容
  const targetVersionRecord = getOne(`
    SELECT id, config_value FROM config_versions 
    WHERE config_id = ? AND version = ?
  `, [id, targetVersion])
  
  if (!targetVersionRecord) {
    return res.status(404).json({ code: 404, message: '目标版本不存在' })
  }
  
  // 更新配置到目标版本
  const newVersion = config.version + 1
  runQuery(`
    UPDATE configs SET config_value = ?, version = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [targetVersionRecord.config_value, newVersion, id])
  
  // 记录版本历史
  runQuery(`
    INSERT INTO config_versions (config_id, version, config_value, change_note)
    VALUES (?, ?, ?, ?)
  `, [id, newVersion, targetVersionRecord.config_value, `回滚到版本 ${targetVersion}`])
  
  res.json({ code: 200, message: '配置已回滚', data: { newVersion } })
}))

// GET /api/configs/:id/diff - 配置对比
router.get('/:id/diff', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const fromVersion = parseInt(req.query.from as string) || null
  const toVersion = parseInt(req.query.to as string) || null
  
  const config = getOne('SELECT id, config_name, config_value, version FROM configs WHERE id = ?', [id])
  if (!config) {
    return res.status(404).json({ code: 404, message: '配置不存在' })
  }
  
  // 如果没有指定版本，使用当前版本
  const versionTo = toVersion || config.version
  
  // 获取目标版本内容
  const toVersionRecord = getOne(`
    SELECT version, config_value FROM config_versions 
    WHERE config_id = ? AND version = ?
  `, [id, versionTo])
  
  const toValue = toVersionRecord?.config_value || ''
  
  // 获取源版本内容（默认为前一版本）
  let fromValue = ''
  if (fromVersion) {
    const fromVersionRecord = getOne(`
      SELECT config_value FROM config_versions 
      WHERE config_id = ? AND version = ?
    `, [id, fromVersion])
    fromValue = fromVersionRecord?.config_value || ''
  } else {
    // 获取前一版本
    const prevVersionRecord = getOne(`
      SELECT config_value FROM config_versions 
      WHERE config_id = ? AND version < ?
      ORDER BY version DESC LIMIT 1
    `, [id, versionTo])
    fromValue = prevVersionRecord?.config_value || ''
  }
  
  // 计算差异（简化版，实际使用 diff 库）
  const diff = computeDiff(fromValue, toValue)
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      configId: id,
      configName: config.config_name,
      fromVersion: fromVersion || (versionTo - 1) || 0,
      toVersion: versionTo,
      fromValue,
      toValue,
      diff,
    }
  })
}))

// 简化差异计算
function computeDiff(from: string, to: string): { type: string; value: string }[] {
  const diff: { type: string; value: string }[] = []
  const fromLines = from.split('\n')
  const toLines = to.split('\n')
  
  // 简单的行对比
  const maxLen = Math.max(fromLines.length, toLines.length)
  for (let i = 0; i < maxLen; i++) {
    if (fromLines[i] !== toLines[i]) {
      if (fromLines[i] !== undefined) {
        diff.push({ type: 'removed', value: fromLines[i] })
      }
      if (toLines[i] !== undefined) {
        diff.push({ type: 'added', value: toLines[i] })
      }
    }
  }
  
  return diff
}

export default router