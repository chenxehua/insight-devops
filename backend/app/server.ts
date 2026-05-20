// 服务器入口
import express, { Application } from 'express'
import cors from 'cors'
import { config } from './config'
import { initDatabase, closeDatabase } from './lib/database'
import { errorMiddleware, notFoundMiddleware } from './lib/middleware/error'
import { auditMiddleware } from './lib/middleware/audit'
import { logInfo, logError, logWarn, requestLogger } from './lib/utils/logger'

// 导入路由
import authRoutes from './api/auth'
import userRoutes from './api/users'
import roleRoutes from './api/roles'
import appRoutes from './api/apps'
import deployRoutes from './api/deploys'
import scriptRoutes from './api/scripts'
import configRoutes from './api/configs'
import monitorRoutes from './api/monitors'
import logRoutes from './api/logs'
import faultRoutes from './api/faults'
import imageRoutes from './api/images'
import backupRoutes from './api/backups'
import checkRoutes from './api/checks'

// 创建应用
const app: Application = express()

// 中间件
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 审计日志中间件
app.use(auditMiddleware())

// API路由
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/apps', appRoutes)
app.use('/api/deploys', deployRoutes)
app.use('/api/scripts', scriptRoutes)
app.use('/api/configs', configRoutes)
app.use('/api/monitors', monitorRoutes)
app.use('/api/logs', logRoutes)
app.use('/api/faults', faultRoutes)
app.use('/api/images', imageRoutes)
app.use('/api/backups', backupRoutes)
app.use('/api/checks', checkRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404处理
app.use(notFoundMiddleware)

// 错误处理
app.use(errorMiddleware)

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase()
    
    app.listen(config.port, () => {
      logInfo(`🚀 服务器启动成功，端口: ${config.port}`)
      logInfo(`📝 环境: ${config.env}`)
      logInfo(`🔗 API地址: http://localhost:${config.port}/api`)
    })
  } catch (error) {
    logError('服务器启动失败', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  logInfo('收到SIGTERM信号，开始关闭服务器...')
  closeDatabase()
  process.exit(0)
})

process.on('SIGINT', () => {
  logInfo('收到SIGINT信号，开始关闭服务器...')
  closeDatabase()
  process.exit(0)
})

startServer()

export default app