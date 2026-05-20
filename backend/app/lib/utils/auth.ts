// 认证工具
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import config from '../../config'

// Token负载
export interface TokenPayload {
  userId: number
  username: string
  email: string
  role?: string
}

// 生成Token
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  })
}

// 生成刷新Token
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  })
}

// 验证Token
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload
  } catch {
    return null
  }
}

// 密码加密
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// 密码验证
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// 生成随机字符串
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default {
  generateToken,
  generateRefreshToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  generateRandomString,
}