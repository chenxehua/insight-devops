// 数据库工具 - 使用 sql.js (纯 JavaScript SQLite)
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import config from '../config'

const __dirname = dirname(fileURLToPath(import.meta.url))

// 数据库路径
const dbDir = resolve(__dirname, '../../prisma')
const dbPath = resolve(dbDir, 'dev.db')

// sql.js 初始化器
let SQL: initSqlJs.SqlJsStatic | null = null

// 数据库实例
let db: SqlJsDatabase | null = null

// 初始化 SQL.js
async function initSql(): Promise<initSqlJs.SqlJsStatic> {
  if (!SQL) {
    SQL = await initSqlJs()
  }
  return SQL
}

// 保存数据库到文件
function saveDatabase(): void {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    writeFileSync(dbPath, buffer)
  }
}

// 获取数据库实例
export async function getDatabase(): Promise<SqlJsDatabase> {
  if (!db) {
    const sql = await initSql()
    
    // 确保目录存在
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
    }
    
    // 加载现有数据库或创建新数据库
    if (existsSync(dbPath)) {
      const fileBuffer = readFileSync(dbPath)
      db = new sql.Database(fileBuffer)
    } else {
      db = new sql.Database()
    }
  }
  return db
}

// 初始化数据库表
export async function initDatabase(): Promise<void> {
  const database = await getDatabase()
  
  // 用户表
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      real_name TEXT,
      status INTEGER DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      is_deleted INTEGER DEFAULT 0
    )
  `)
  
  // 角色表
  database.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_name TEXT UNIQUE NOT NULL,
      role_code TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  
  // 权限表
  database.run(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      perm_name TEXT NOT NULL,
      perm_code TEXT UNIQUE NOT NULL,
      perm_type TEXT NOT NULL,
      resource_path TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  
  // 用户角色关联表
  database.run(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    )
  `)
  
  // 角色权限关联表
  database.run(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `)
  
  // 应用表
  database.run(`
    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_name TEXT NOT NULL,
      app_code TEXT UNIQUE NOT NULL,
      app_type TEXT DEFAULT 'docker',
      repo_url TEXT,
      dockerfile TEXT,
      config_files TEXT,
      health_check_path TEXT,
      pre_script TEXT,
      post_script TEXT,
      env_vars TEXT,
      description TEXT,
      owner_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `)
  
  // 部署任务表
  database.run(`
    CREATE TABLE IF NOT EXISTS deploy_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL,
      environment TEXT NOT NULL,
      version TEXT NOT NULL,
      strategy TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      deploy_log TEXT,
      result TEXT,
      executor_id INTEGER,
      started_at TEXT,
      finished_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
      FOREIGN KEY (executor_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `)
  
  // 脚本表
  database.run(`
    CREATE TABLE IF NOT EXISTS scripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      script_name TEXT NOT NULL,
      script_code TEXT UNIQUE NOT NULL,
      script_type TEXT NOT NULL,
      content TEXT NOT NULL,
      params TEXT,
      category TEXT,
      tags TEXT,
      version INTEGER DEFAULT 1,
      description TEXT,
      owner_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `)
  
  // 脚本执行记录表
  database.run(`
    CREATE TABLE IF NOT EXISTS script_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      script_id INTEGER NOT NULL,
      params TEXT,
      target_host TEXT,
      status TEXT DEFAULT 'pending',
      output TEXT,
      error_output TEXT,
      started_at TEXT,
      finished_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE
    )
  `)
  
  // 脚本版本表
  database.run(`
    CREATE TABLE IF NOT EXISTS script_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      script_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      change_note TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE
    )
  `)
  
  // 配置表
  database.run(`
    CREATE TABLE IF NOT EXISTS configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_name TEXT NOT NULL,
      config_key TEXT NOT NULL,
      app_id INTEGER,
      environment TEXT,
      config_type TEXT DEFAULT 'key-value',
      config_value TEXT,
      version INTEGER DEFAULT 1,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(app_id, environment, config_key),
      FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
    )
  `)
  
  // 配置版本表
  database.run(`
    CREATE TABLE IF NOT EXISTS config_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      config_value TEXT NOT NULL,
      change_note TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (config_id) REFERENCES configs(id) ON DELETE CASCADE
    )
  `)
  
  // 监控指标表
  database.run(`
    CREATE TABLE IF NOT EXISTS monitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitor_name TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      collect_type TEXT DEFAULT 'agent',
      collect_path TEXT,
      interval INTEGER DEFAULT 10,
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  
  // 监控数据表
  database.run(`
    CREATE TABLE IF NOT EXISTS metric_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitor_id INTEGER NOT NULL,
      value REAL NOT NULL,
      timestamp TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
    )
  `)
  
  // 告警规则表
  database.run(`
    CREATE TABLE IF NOT EXISTS alert_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_name TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      metric_name TEXT NOT NULL,
      condition TEXT NOT NULL,
      threshold REAL NOT NULL,
      duration INTEGER DEFAULT 60,
      alert_level TEXT NOT NULL,
      message TEXT,
      notify_channels TEXT,
      notify_users TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  
  // 告警记录表
  database.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER,
      alert_name TEXT NOT NULL,
      alert_level TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      metric_name TEXT,
      metric_value TEXT,
      threshold TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending',
      handler_id INTEGER,
      handle_time TEXT,
      handle_note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (rule_id) REFERENCES alert_rules(id),
      FOREIGN KEY (handler_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `)
  
  // 日志表
  database.run(`
    CREATE TABLE IF NOT EXISTS log_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      level TEXT NOT NULL,
      service TEXT,
      host TEXT,
      message TEXT NOT NULL,
      trace_id TEXT,
      span_id TEXT,
      extra TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  
  // 故障表
  database.run(`
    CREATE TABLE IF NOT EXISTS faults (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fault_title TEXT NOT NULL,
      fault_level TEXT NOT NULL,
      fault_type TEXT,
      target_type TEXT,
      target_id TEXT,
      root_cause TEXT,
      solution TEXT,
      status TEXT DEFAULT 'open',
      handler_id INTEGER,
      occurred_at TEXT,
      detected_at TEXT,
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (handler_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `)
  
  // 镜像仓库表
  database.run(`
    CREATE TABLE IF NOT EXISTS image_repos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_name TEXT NOT NULL,
      repo_type TEXT DEFAULT 'harbor',
      repo_url TEXT NOT NULL,
      username TEXT,
      password TEXT,
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  
  // 镜像表
  database.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_id INTEGER,
      image_name TEXT NOT NULL,
      tag TEXT DEFAULT 'latest',
      image_size INTEGER DEFAULT 0,
      digest TEXT,
      scan_status TEXT,
      scan_report TEXT,
      last_pulled_at TEXT,
      pull_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (repo_id) REFERENCES image_repos(id)
    )
  `)
  
  // 数据库表
  database.run(`
    CREATE TABLE IF NOT EXISTS databases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      db_name TEXT NOT NULL,
      db_type TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      username TEXT,
      password TEXT,
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  
  // 备份记录表
  database.run(`
    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      database_id INTEGER NOT NULL,
      backup_type TEXT NOT NULL,
      backup_path TEXT,
      backup_size INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      started_at TEXT,
      finished_at TEXT,
      error_message TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (database_id) REFERENCES databases(id) ON DELETE CASCADE
    )
  `)
  
  // 巡检任务表
  database.run(`
    CREATE TABLE IF NOT EXISTS check_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_name TEXT NOT NULL,
      task_type TEXT,
      target_id TEXT,
      check_items TEXT NOT NULL,
      schedule_type TEXT,
      schedule_cron TEXT,
      next_run_at TEXT,
      last_run_at TEXT,
      status TEXT DEFAULT 'enabled',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)
  
  // 巡检报告表
  database.run(`
    CREATE TABLE IF NOT EXISTS check_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      start_at TEXT,
      end_at TEXT,
      result TEXT,
      summary TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (task_id) REFERENCES check_tasks(id) ON DELETE CASCADE
    )
  `)
  
  // 审计日志表
  database.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      detail TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)
  
  // 通知记录表
  database.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      sent_at TEXT,
      error_msg TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
  
  // 创建索引
  database.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_apps_code ON apps(app_code)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_deploy_tasks_status ON deploy_tasks(status)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_deploy_tasks_app ON deploy_tasks(app_id)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_scripts_code ON scripts(script_code)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_faults_status ON faults(status)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON log_entries(timestamp)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_backups_status ON backups(status)`)
  database.run(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)`)
  
  // 保存到文件
  saveDatabase()
  
  console.log('✅ 数据库初始化完成')
}

// 关闭数据库连接
export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}

// 带自动保存的数据库执行
export function runQuery(sql: string, params: any[] = []): void {
  const database = db
  if (!database) {
    throw new Error('Database not initialized')
  }
  database.run(sql, params)
  saveDatabase()
}

// 查询单行
export function getOne(sql: string, params: any[] = []): any {
  const database = db
  if (!database) {
    throw new Error('Database not initialized')
  }
  const stmt = database.prepare(sql)
  stmt.bind(params)
  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()
    return row
  }
  stmt.free()
  return null
}

// 查询多行
export function getAll(sql: string, params: any[] = []): any[] {
  const database = db
  if (!database) {
    throw new Error('Database not initialized')
  }
  const stmt = database.prepare(sql)
  stmt.bind(params)
  const rows: any[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

// 获取最后插入的 ID
export function getLastInsertRowId(): number {
  const database = db
  if (!database) {
    throw new Error('Database not initialized')
  }
  const result = database.exec('SELECT last_insert_rowid() as id')
  return result[0]?.values[0]?.[0] as number || 0
}

// 获取影响的行数
export function getChanges(): number {
  const database = db
  if (!database) {
    throw new Error('Database not initialized')
  }
  const result = database.exec('SELECT changes() as count')
  return result[0]?.values[0]?.[0] as number || 0
}

// 导出 saveDatabase 函数
export { saveDatabase }

export default { 
  getDatabase, 
  initDatabase, 
  closeDatabase,
  runQuery,
  getOne,
  getAll,
  getLastInsertRowId,
  getChanges,
  saveDatabase
}