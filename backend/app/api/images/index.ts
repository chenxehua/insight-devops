// 镜像API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/images/repos - 镜像仓库列表
router.get('/repos', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.keyword) {
    where += ' AND (repo_name LIKE ? OR repo_url LIKE ?)'
    const keyword = `%${req.query.keyword}%`
    params.push(keyword, keyword)
  }
  if (req.query.repoType) {
    where += ' AND repo_type = ?'
    params.push(req.query.repoType)
  }
  if (req.query.status) {
    where += ' AND status = ?'
    params.push(parseInt(req.query.status as string))
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM image_repos ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT id, repo_name, repo_type, repo_url, description, status, created_at, updated_at
    FROM image_repos
    ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(r => ({
        id: r.id,
        repoName: r.repo_name,
        repoType: r.repo_type,
        repoUrl: r.repo_url,
        description: r.description,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/images/repos/:id - 镜像仓库详情
router.get('/repos/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const repo = getOne('SELECT * FROM image_repos WHERE id = ?', [id])
  
  if (!repo) {
    return res.status(404).json({ code: 404, message: '镜像仓库不存在' })
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: repo.id,
      repoName: repo.repo_name,
      repoType: repo.repo_type,
      repoUrl: repo.repo_url,
      username: repo.username,
      description: repo.description,
      status: repo.status,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
    }
  })
}))

// POST /api/images/repos - 创建镜像仓库
router.post('/repos', asyncHandler(async (req: Request, res: Response) => {
  const { repoName, repoType, repoUrl, username, password, description } = req.body
  
  if (!repoName || !repoUrl) {
    return res.status(400).json({ code: 400, message: '仓库名称和URL不能为空' })
  }
  
  runQuery(`
    INSERT INTO image_repos (repo_name, repo_type, repo_url, username, password, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    repoName, repoType || 'harbor', repoUrl, username || null,
    password ? Buffer.from(password).toString('base64') : null, description || null
  ])
  
  const repoId = getLastInsertRowId()
  
  res.json({ code: 200, message: '创建成功', data: { id: repoId } })
}))

// PUT /api/images/repos/:id - 更新镜像仓库
router.put('/repos/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const repo = getOne('SELECT id FROM image_repos WHERE id = ?', [id])
  if (!repo) {
    return res.status(404).json({ code: 404, message: '镜像仓库不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    repoName: 'repo_name', repoType: 'repo_type', repoUrl: 'repo_url',
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
    runQuery(`UPDATE image_repos SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/images/repos/:id - 删除镜像仓库
router.delete('/repos/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM image_repos WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '镜像仓库不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

// 镜像列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  let where = 'WHERE 1=1'
  const params: any[] = []
  
  if (req.query.keyword) {
    where += ' AND (image_name LIKE ? OR tag LIKE ?)'
    const keyword = `%${req.query.keyword}%`
    params.push(keyword, keyword)
  }
  if (req.query.repoId) {
    where += ' AND repo_id = ?'
    params.push(parseInt(req.query.repoId as string))
  }
  if (req.query.scanStatus) {
    where += ' AND scan_status = ?'
    params.push(req.query.scanStatus)
  }
  
  const totalResult = getOne(`SELECT COUNT(*) as count FROM images ${where}`, params)
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT i.id, i.repo_id, i.image_name, i.tag, i.image_size, i.digest, i.scan_status,
           i.scan_report, i.last_pulled_at, i.pull_count, i.created_at, i.updated_at,
           r.repo_name
    FROM images i
    LEFT JOIN image_repos r ON i.repo_id = r.id
    ${where}
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(i => ({
        id: i.id,
        repoId: i.repo_id,
        repoName: i.repo_name,
        imageName: i.image_name,
        tag: i.tag,
        imageSize: i.image_size,
        digest: i.digest,
        scanStatus: i.scan_status,
        lastPulledAt: i.last_pulled_at,
        pullCount: i.pull_count,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/images/:id - 镜像详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const image = getOne(`
    SELECT i.*, r.repo_name
    FROM images i
    LEFT JOIN image_repos r ON i.repo_id = r.id
    WHERE i.id = ?
  `, [id])
  
  if (!image) {
    return res.status(404).json({ code: 404, message: '镜像不存在' })
  }
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: image.id,
      repoId: image.repo_id,
      repoName: image.repo_name,
      imageName: image.image_name,
      tag: image.tag,
      imageSize: image.image_size,
      digest: image.digest,
      scanStatus: image.scan_status,
      scanReport: image.scan_report ? JSON.parse(image.scan_report) : null,
      lastPulledAt: image.last_pulled_at,
      pullCount: image.pull_count,
      createdAt: image.created_at,
      updatedAt: image.updated_at,
    }
  })
}))

// POST /api/images - 创建镜像
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { repoId, imageName, tag, imageSize, digest, scanStatus } = req.body
  
  if (!imageName || !tag) {
    return res.status(400).json({ code: 400, message: '镜像名称和标签不能为空' })
  }
  
  runQuery(`
    INSERT INTO images (repo_id, image_name, tag, image_size, digest, scan_status)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [repoId || null, imageName, tag, imageSize || 0, digest || null, scanStatus || null])
  
  const imageId = getLastInsertRowId()
  
  res.json({ code: 200, message: '创建成功', data: { id: imageId } })
}))

// PUT /api/images/:id - 更新镜像
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const image = getOne('SELECT id FROM images WHERE id = ?', [id])
  if (!image) {
    return res.status(404).json({ code: 404, message: '镜像不存在' })
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  const fields: Record<string, string> = {
    repoId: 'repo_id', imageName: 'image_name', tag: 'tag',
    imageSize: 'image_size', digest: 'digest', scanStatus: 'scan_status',
    scanReport: 'scan_report', lastPulledAt: 'last_pulled_at', pullCount: 'pull_count'
  }
  
  for (const [key, column] of Object.entries(fields)) {
    if (req.body[key] !== undefined) {
      updates.push(`${column} = ?`)
      if (key === 'scanReport') {
        params.push(req.body[key] ? JSON.stringify(req.body[key]) : null)
      } else if (key === 'lastPulledAt') {
        params.push(req.body[key] ? new Date(req.body[key]).toISOString() : null)
      } else {
        params.push(req.body[key])
      }
    }
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`UPDATE images SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`, params)
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/images/:id - 删除镜像
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM images WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '镜像不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

export default router