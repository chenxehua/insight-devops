// 日志工具 - 基于 winston
import winston from 'winston'
import config from '../../config'

// 日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
    return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`
  })
)

// 创建日志实例
const logger = winston.createLogger({
  level: config.log.level,
  format: logFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    // 文件输出 - 错误日志
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // 文件输出 - 组合日志
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
})

// 日志记录函数
export function logInfo(message: string, meta?: object): void {
  logger.info(message, meta || {})
}

export function logError(message: string, error?: Error | object): void {
  if (error instanceof Error) {
    logger.error(message, { error: error.message, stack: error.stack })
  } else {
    logger.error(message, error || {})
  }
}

export function logWarn(message: string, meta?: object): void {
  logger.warn(message, meta || {})
}

export function logDebug(message: string, meta?: object): void {
  logger.debug(message, meta || {})
}

// 请求日志中间件
export function requestLogger(req: any, res: any, next: any): void {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    logInfo(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    })
  })
  
  next()
}

export default logger