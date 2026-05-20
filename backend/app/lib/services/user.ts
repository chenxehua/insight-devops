// 用户服务
import { hashPassword } from '../../lib/utils/auth'
import { ApiResponse, PaginationResult, parsePagination, paginate } from '../../lib/utils/common'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'

// 用户列表
export async function listUsers(params: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: number
}): Promise<{ data: PaginationResult<any> }> {
  const { page, pageSize } = parsePagination(params)
  
  let where = 'WHERE is_deleted = 0'
  const queryParams: any[] = []
  
  if (params.keyword) {
    where += ' AND (username LIKE ? OR email LIKE ? OR real_name LIKE ?)'
    const keyword = `%${params.keyword}%`
    queryParams.push(keyword, keyword, keyword)
  }
  
  if (params.status !== undefined) {
    where += ' AND status = ?'
    queryParams.push(params.status)
  }
  
  // 查询总数
  const totalResult = getOne(`
    SELECT COUNT(*) as count FROM users ${where}
  `, queryParams)
  const total = totalResult?.count || 0
  
  // 查询列表
  const offset = (page - 1) * pageSize
  const list = getAll(`
    SELECT id, username, email, phone, real_name, status, last_login_at, created_at
    FROM users 
    ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, [...queryParams, pageSize, offset])
  
  return {
    data: paginate(
      list.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        phone: u.phone,
        realName: u.real_name,
        status: u.status,
        lastLoginAt: u.last_login_at,
        createdAt: u.created_at,
      })),
      total,
      { page, pageSize }
    )
  }
}

// 获取用户详情
export async function getUserById(id: number): Promise<ApiResponse> {
  const user = getOne(`
    SELECT id, username, email, phone, real_name, status, last_login_at, created_at, updated_at
    FROM users 
    WHERE id = ? AND is_deleted = 0
  `, [id])
  
  if (!user) {
    return { code: 404, message: '用户不存在' }
  }
  
  // 获取用户角色
  const roles = getAll(`
    SELECT r.id, r.role_name, r.role_code, r.description
    FROM roles r
    INNER JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
  `, [id])
  
  return {
    code: 200,
    message: 'success',
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      realName: user.real_name,
      status: user.status,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      roles: roles.map(r => ({
        id: r.id,
        roleName: r.role_name,
        roleCode: r.role_code,
        description: r.description,
      })),
    }
  }
}

// 创建用户
export async function createUser(data: {
  username: string
  password: string
  email: string
  phone?: string
  realName?: string
  roleIds?: number[]
}): Promise<ApiResponse> {
  // 检查用户名和邮箱是否存在
  const existing = getOne(`
    SELECT id FROM users WHERE username = ? OR email = ?
  `, [data.username, data.email])
  
  if (existing) {
    return { code: 409, message: '用户名或邮箱已存在' }
  }
  
  // 加密密码
  const passwordHash = await hashPassword(data.password)
  
  // 创建用户
  runQuery(`
    INSERT INTO users (username, password_hash, email, phone, real_name)
    VALUES (?, ?, ?, ?, ?)
  `, [data.username, passwordHash, data.email, data.phone || null, data.realName || null])
  
  const userId = getLastInsertRowId()
  
  // 分配角色
  if (data.roleIds && data.roleIds.length > 0) {
    for (const roleId of data.roleIds) {
      runQuery(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [userId, roleId])
    }
  }
  
  return {
    code: 200,
    message: '创建成功',
    data: { id: userId }
  }
}

// 更新用户
export async function updateUser(
  id: number, 
  data: {
    email?: string
    phone?: string
    realName?: string
    status?: number
    roleIds?: number[]
  }
): Promise<ApiResponse> {
  // 检查用户是否存在
  const user = getOne(`
    SELECT id FROM users WHERE id = ? AND is_deleted = 0
  `, [id])
  
  if (!user) {
    return { code: 404, message: '用户不存在' }
  }
  
  // 更新用户信息
  const updates: string[] = []
  const params: any[] = []
  
  if (data.email) {
    updates.push('email = ?')
    params.push(data.email)
  }
  if (data.phone !== undefined) {
    updates.push('phone = ?')
    params.push(data.phone)
  }
  if (data.realName !== undefined) {
    updates.push('real_name = ?')
    params.push(data.realName)
  }
  if (data.status !== undefined) {
    updates.push('status = ?')
    params.push(data.status)
  }
  
  if (updates.length > 0) {
    params.push(id)
    runQuery(`
      UPDATE users SET ${updates.join(', ')}, updated_at = datetime('now')
      WHERE id = ?
    `, params)
  }
  
  // 更新角色
  if (data.roleIds) {
    runQuery(`DELETE FROM user_roles WHERE user_id = ?`, [id])
    for (const roleId of data.roleIds) {
      runQuery(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`, [id, roleId])
    }
  }
  
  return { code: 200, message: '更新成功' }
}

// 删除用户
export async function deleteUser(id: number): Promise<ApiResponse> {
  // 软删除
  runQuery(`
    UPDATE users SET is_deleted = 1, updated_at = datetime('now')
    WHERE id = ? AND is_deleted = 0
  `, [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return { code: 404, message: '用户不存在' }
  }
  
  return { code: 200, message: '删除成功' }
}

// 修改密码
export async function changePassword(
  userId: number, 
  oldPassword: string, 
  newPassword: string
): Promise<ApiResponse> {
  const user = getOne(`
    SELECT password_hash FROM users WHERE id = ? AND is_deleted = 0
  `, [userId])
  
  if (!user) {
    return { code: 404, message: '用户不存在' }
  }
  
  // 验证旧密码
  const { verifyPassword } = await import('../../lib/utils/auth')
  const isValid = await verifyPassword(oldPassword, user.password_hash)
  if (!isValid) {
    return { code: 400, message: '原密码错误' }
  }
  
  // 加密新密码
  const newPasswordHash = await hashPassword(newPassword)
  
  runQuery(`
    UPDATE users SET password_hash = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [newPasswordHash, userId])
  
  return { code: 200, message: '密码修改成功' }
}

export default {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
}