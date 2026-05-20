// 全局类型定义

// 用户相关
export interface User {
  id: number
  username: string
  email: string
  phone?: string
  realName?: string
  status: number
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

// 应用相关
export interface App {
  id: number
  appName: string
  appCode: string
  appType: 'docker' | 'k8s' | 'shell'
  repoUrl?: string
  dockerfile?: string
  configFiles?: string
  healthCheckPath?: string
  preScript?: string
  postScript?: string
  envVars?: string
  description?: string
  ownerId?: number
  owner?: User
  createdAt: string
  updatedAt: string
}

// 部署任务相关
export interface DeployTask {
  id: number
  appId: number
  app?: App
  environment: 'dev' | 'staging' | 'prod'
  version: string
  strategy: 'normal' | 'blue_green' | 'canary'
  status: 'pending' | 'running' | 'success' | 'failed' | 'rollback'
  progress: number
  deployLog?: string
  result?: string
  executorId?: number
  executor?: User
  startedAt?: string
  finishedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateDeployRequest {
  appId: number
  environment: string
  version: string
  strategy?: string
}

// 脚本相关
export interface Script {
  id: number
  scriptName: string
  scriptCode: string
  scriptType: 'shell' | 'python' | 'ansible' | 'yaml' | 'json' | 'other'
  content: string
  params?: string
  category?: string
  tags?: string
  version: number
  description?: string
  ownerId?: number
  owner?: User
  createdAt: string
  updatedAt: string
}

export interface ExecuteScriptRequest {
  scriptId: number
  params?: Record<string, any>
  targetHost?: string
}

// 配置相关
export interface Config {
  id: number
  configName: string
  configKey: string
  appId?: number
  app?: App
  environment?: string
  configType: 'file' | 'key-value' | 'json' | 'yaml'
  configValue?: string
  version: number
  description?: string
  createdAt: string
  updatedAt: string
}

// 监控相关
export interface Monitor {
  id: number
  monitorName: string
  metricName: string
  targetType: 'host' | 'app' | 'service'
  targetId?: string
  collectType: 'agent' | 'jmx' | 'http'
  collectPath?: string
  interval: number
  description?: string
  status: number
  createdAt: string
  updatedAt: string
}

export interface Alert {
  id: number
  ruleId?: number
  alertName: string
  alertLevel: 'P0' | 'P1' | 'P2'
  targetType: string
  targetId?: string
  metricName?: string
  metricValue?: string
  threshold?: string
  message?: string
  status: 'pending' | 'acknowledged' | 'resolved'
  handlerId?: number
  handler?: User
  handleTime?: string
  handleNote?: string
  createdAt: string
  updatedAt: string
}

export interface AlertRule {
  id: number
  ruleName: string
  targetType: string
  targetId?: string
  metricName: string
  condition: string
  threshold: number
  duration: number
  alertLevel: 'P0' | 'P1' | 'P2'
  message?: string
  notifyChannels?: string
  notifyUsers?: string
  status: number
  createdAt: string
  updatedAt: string
}

// 日志相关
export interface LogEntry {
  id: number
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  service?: string
  host?: string
  message: string
  traceId?: string
  spanId?: string
  extra?: string
}

export interface LogSearchRequest {
  keyword?: string
  level?: string
  service?: string
  host?: string
  startTime?: string
  endTime?: string
  page?: number
  pageSize?: number
}

// 故障相关
export interface Fault {
  id: number
  faultTitle: string
  faultLevel: 'P0' | 'P1' | 'P2'
  faultType?: string
  targetType?: string
  targetId?: string
  rootCause?: string
  solution?: string
  status: 'open' | 'handling' | 'resolved' | 'closed'
  handlerId?: number
  handler?: User
  occurredAt?: string
  detectedAt?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

// 镜像相关
export interface Image {
  id: number
  repoId?: number
  imageName: string
  tag: string
  imageSize: number
  digest?: string
  scanStatus?: 'pending' | 'passed' | 'failed'
  scanReport?: string
  lastPulledAt?: string
  pullCount: number
  createdAt: string
  updatedAt: string
}

// 备份相关
export interface Backup {
  id: number
  databaseId: number
  database?: Database
  backupType: 'full' | 'incremental'
  backupPath?: string
  backupSize: number
  status: 'pending' | 'running' | 'success' | 'failed'
  startedAt?: string
  finishedAt?: string
  errorMessage?: string
  createdAt: string
}

export interface Database {
  id: number
  dbName: string
  dbType: string
  host: string
  port: number
  username?: string
  password?: string
  description?: string
  status: number
  createdAt: string
  updatedAt: string
}

// 巡检相关
export interface CheckTask {
  id: number
  taskName: string
  taskType?: string
  targetId?: string
  checkItems: string
  scheduleType?: 'once' | 'daily' | 'weekly' | 'monthly'
  scheduleCron?: string
  nextRunAt?: string
  lastRunAt?: string
  status: 'enabled' | 'disabled'
  createdAt: string
  updatedAt: string
}

export interface CheckReport {
  id: number
  taskId: number
  task?: CheckTask
  startAt?: string
  endAt?: string
  result?: string
  summary?: string
  status: 'pending' | 'running' | 'success' | 'failed'
  createdAt: string
}

// API 响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageResponse<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 审计日志
export interface AuditLog {
  id: number
  userId?: number
  username?: string
  action: string
  resourceType?: string
  resourceId?: number
  detail?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

// 角色与权限
export interface Role {
  id: number
  roleName: string
  roleCode: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: number
  permName: string
  permCode: string
  permType: 'menu' | 'button' | 'api'
  resourcePath?: string
  description?: string
}

// 仪表盘统计
export interface DashboardStats {
  appCount: number
  deployCount: number
  alertCount: number
  faultCount: number
  recentDeploys: DeployTask[]
  pendingAlerts: Alert[]
  recentFaults: Fault[]
}