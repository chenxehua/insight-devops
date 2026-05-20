// 认证服务
import { 
  generateToken, 
  generateRefreshToken, 
  verifyToken, 
  hashPassword, 
  verifyPassword, 
  TokenPayload 
} from '../../lib/utils/auth'
import { ApiResponse } from '../../lib/utils/common'
import { getOne, runQuery } from '../../lib/database'

// 登录
export async function login(username: string, password: string): Promise<ApiResponse> {
  // 查询用户
  const user = getOne(`
    SELECT id, username, email, phone, real_name, password_hash, status
    FROM users 
    WHERE username = ? AND is_deleted = 0
  `, [username])
  
  if (!user) {
    return { code: 401, message: '用户名或密码错误' }
  }
  
  if (user.status === 0) {
    return { code: 401, message: '账号已被禁用' }
  }
  
  // 验证密码
  const isValid = await verifyPassword(password, user.password_hash)
  if (!isValid) {
    return { code: 401, message: '用户名或密码错误' }
  }
  
  // 生成Token
  const payload: TokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
  }
  
  const token = generateToken(payload)
  const refreshToken = generateRefreshToken(payload)
  
  // 更新最后登录时间
  runQuery(`UPDATE users SET last_login_at = datetime('now') WHERE id = ?`, [user.id])
  
  return {
    code: 200,
    message: '登录成功',
    data: {
      token,
      refreshToken,
      expiresIn: '24h',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        realName: user.real_name,
      }
    }
  }
}

// 登出
export async function logout(userId: number): Promise<ApiResponse> {
  // JWT是无状态的，登出只需要客户端删除token
  // 这里可以记录登出日志
  return { code: 200, message: '登出成功' }
}

// 获取当前用户
export async function getCurrentUser(userId: number): Promise<ApiResponse> {
  const user = getOne(`
    SELECT id, username, email, phone, real_name, status, last_login_at, created_at
    FROM users 
    WHERE id = ? AND is_deleted = 0
  `, [userId])
  
  if (!user) {
    return { code: 404, message: '用户不存在' }
  }
  
  // 获取用户角色
  const roles = getAll(`
    SELECT r.id, r.role_name, r.role_code
    FROM roles r
    INNER JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
  `, [userId])
  
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
      roles: roles.map(r => ({
        id: r.id,
        roleName: r.role_name,
        roleCode: r.role_code,
      })),
    }
  }
}

// 刷新Token
export async function refreshToken(refreshToken: string): Promise<ApiResponse> {
  const payload = verifyToken(refreshToken)
  
  if (!payload) {
    return { code: 401, message: '刷新令牌无效或已过期' }
  }
  
  const newToken = generateToken(payload)
  const newRefreshToken = generateRefreshToken(payload)
  
  return {
    code: 200,
    message: '刷新成功',
    data: {
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: '24h',
    }
  }
}

// 注册用户
export async function register(
  username: string, 
  password: string, 
  email: string
): Promise<ApiResponse> {
  // 检查用户名是否存在
  const existingUser = getOne(`
    SELECT id FROM users WHERE username = ? OR email = ?
  `, [username, email])
  
  if (existingUser) {
    return { code: 409, message: '用户名或邮箱已存在' }
  }
  
  // 加密密码
  const passwordHash = await hashPassword(password)
  
  // 创建用户
  runQuery(`
    INSERT INTO users (username, password_hash, email)
    VALUES (?, ?, ?)
  `, [username, passwordHash, email])
  
  // 获取新用户
  const user = getOne(`
    SELECT id, username, email FROM users WHERE id = last_insert_rowid()
  `)
  
  return {
    code: 200,
    message: '注册成功',
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
    }
  }
}

export default {
  login,
  logout,
  getCurrentUser,
  refreshToken,
  register,
}