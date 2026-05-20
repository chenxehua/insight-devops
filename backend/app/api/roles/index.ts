// 角色API路由
import { Router, Request, Response } from 'express'
import { asyncHandler } from '../../lib/middleware/error'
import { authMiddleware } from '../../lib/middleware/auth'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'
import { paginate, parsePagination } from '../../lib/utils/common'

const router = Router()

router.use(authMiddleware)

// GET /api/roles - 角色列表
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = parsePagination(req.query)
  
  const totalResult = getOne('SELECT COUNT(*) as count FROM roles', [])
  const total = totalResult?.count || 0
  const offset = (page - 1) * pageSize
  
  const list = getAll(`
    SELECT id, role_name, role_code, description, created_at, updated_at
    FROM roles
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [pageSize, offset])
  
  res.json({
    code: 200,
    message: 'success',
    data: paginate(
      list.map(r => ({
        id: r.id,
        roleName: r.role_name,
        roleCode: r.role_code,
        description: r.description,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      total,
      { page, pageSize }
    )
  })
}))

// GET /api/roles/:id - 角色详情
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  const role = getOne(`
    SELECT id, role_name, role_code, description, created_at, updated_at
    FROM roles WHERE id = ?
  `, [id])
  
  if (!role) {
    return res.status(404).json({ code: 404, message: '角色不存在' })
  }
  
  // 获取角色权限
  const permissions = getAll(`
    SELECT p.id, p.perm_name, p.perm_code, p.perm_type, p.resource_path
    FROM permissions p
    INNER JOIN role_permissions rp ON p.id = rp.permission_id
    WHERE rp.role_id = ?
  `, [id])
  
  res.json({
    code: 200,
    message: 'success',
    data: {
      id: role.id,
      roleName: role.role_name,
      roleCode: role.role_code,
      description: role.description,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
      permissions: permissions.map(p => ({
        id: p.id,
        permName: p.perm_name,
        permCode: p.perm_code,
        permType: p.perm_type,
        resourcePath: p.resource_path,
      })),
    }
  })
}))

// POST /api/roles - 创建角色
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { roleName, roleCode, description, permissionIds } = req.body
  
  if (!roleName || !roleCode) {
    return res.status(400).json({ code: 400, message: '角色名称和代码不能为空' })
  }
  
  // 检查角色代码是否已存在
  const existing = getOne('SELECT id FROM roles WHERE role_code = ?', [roleCode])
  if (existing) {
    return res.status(409).json({ code: 409, message: '角色代码已存在' })
  }
  
  runQuery(`
    INSERT INTO roles (role_name, role_code, description)
    VALUES (?, ?, ?)
  `, [roleName, roleCode, description || null])
  
  const roleId = getLastInsertRowId()
  
  // 添加权限
  if (permissionIds && permissionIds.length > 0) {
    for (const permissionId of permissionIds) {
      runQuery(`INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, [roleId, permissionId])
    }
  }
  
  res.json({ code: 200, message: '创建成功', data: { id: roleId } })
}))

// PUT /api/roles/:id - 更新角色
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  const { roleName, description, permissionIds } = req.body
  
  const role = getOne('SELECT id FROM roles WHERE id = ?', [id])
  if (!role) {
    return res.status(404).json({ code: 404, message: '角色不存在' })
  }
  
  // 更新角色信息
  if (roleName) {
    runQuery('UPDATE roles SET role_name = ?, updated_at = datetime(\'now\') WHERE id = ?', [roleName, id])
  }
  if (description !== undefined) {
    runQuery('UPDATE roles SET description = ?, updated_at = datetime(\'now\') WHERE id = ?', [description, id])
  }
  
  // 更新权限
  if (permissionIds) {
    runQuery('DELETE FROM role_permissions WHERE role_id = ?', [id])
    for (const permissionId of permissionIds) {
      runQuery(`INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)`, [id, permissionId])
    }
  }
  
  res.json({ code: 200, message: '更新成功' })
}))

// DELETE /api/roles/:id - 删除角色
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id)
  
  runQuery('DELETE FROM roles WHERE id = ?', [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return res.status(404).json({ code: 404, message: '角色不存在' })
  }
  
  res.json({ code: 200, message: '删除成功' })
}))

export default router