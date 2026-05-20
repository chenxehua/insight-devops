// 应用配置
import { z } from 'zod'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 环境变量配置
export const config = {
  // 服务器配置
  port: parseInt(process.env.PORT || '3000'),
  env: process.env.NODE_ENV || 'development',
  
  // 数据库配置
  database: {
    url: process.env.DATABASE_URL || `file:${resolve(__dirname, '../../prisma/dev.db')}`,
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'insight-devops-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  
  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  
  // 上传配置
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  },
}

// 验证配置
export const configSchema = z.object({
  port: z.number().min(1).max(65535),
  env: z.enum(['development', 'production', 'test']),
  jwt: z.object({
    secret: z.string().min(32),
    expiresIn: z.string(),
    refreshExpiresIn: z.string(),
  }),
})

// 导出类型
export type Config = typeof config

export default config