// 应用服务
import { ApiResponse, PaginationResult, parsePagination, paginate } from '../../lib/utils/common'
import { getOne, getAll, runQuery, getLastInsertRowId, getChanges } from '../../lib/database'

// 应用列表
export async function listApps(params: {
  page?: number
  pageSize?: number
  keyword?: string
  appType?: string
}): Promise<{ data: PaginationResult<any> }> {
  const { page, pageSize } = parsePagination(params)
  
  let where = ''
  const queryParams: any[] = []
  
  const conditions: string[] = []
  
  if (params.keyword) {
    conditions.push('(app_name LIKE ? OR app_code LIKE ?)')
    const keyword = `%${params.keyword}%`
    queryParams.push(keyword, keyword)
  }
  
  if (params.appType) {
    conditions.push('app_type = ?')
    queryParams.push(params.appType)
  }
  
  if (conditions.length > 0) {
    where = 'WHERE ' + conditions.join(' AND ')
  }
  
  // 查询总数
  const totalResult = getOne(`
    SELECT COUNT(*) as count FROM apps ${where}
  `, queryParams)
  const total = totalResult?.count || 0
  
  // 查询列表
  const offset = (page - 1) * pageSize
  const list = getAll(`
    SELECT a.id, a.app_name, a.app_code, a.app_type, a.repo_url, a.description, 
           a.owner_id, u.username as owner_name, a.created_at, a.updated_at
    FROM apps a
    LEFT JOIN users u ON a.owner_id = u.id
    ${where}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `, [...queryParams, pageSize, offset])
  
  return {
    data: paginate(
      list.map(a => ({
        id: a.id,
        appName: a.app_name,
        appCode: a.app_code,
        appType: a.app_type,
        repoUrl: a.repo_url,
        description: a.description,
        ownerId: a.owner_id,
        ownerName: a.owner_name,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      })),
      total,
      { page, pageSize }
    )
  }
}

// 获取应用详情
export async function getAppById(id: number): Promise<ApiResponse> {
  const app = getOne(`
    SELECT a.*, u.username as owner_name
    FROM apps a
    LEFT JOIN users u ON a.owner_id = u.id
    WHERE a.id = ?
  `, [id])
  
  if (!app) {
    return { code: 404, message: '应用不存在' }
  }
  
  // 获取关联的配置
  const configs = getAll(`
    SELECT id, config_name, config_key, environment, config_type, version
    FROM configs WHERE app_id = ?
    ORDER BY environment, config_key
  `, [id])
  
  // 获取最近的部署任务
  const recentDeploys = getAll(`
    SELECT d.id, d.environment, d.version, d.status, d.created_at
    FROM deploy_tasks d
    WHERE d.app_id = ?
    ORDER BY d.created_at DESC
    LIMIT 5
  `, [id])
  
  return {
    code: 200,
    message: 'success',
    data: {
      id: app.id,
      appName: app.app_name,
      appCode: app.app_code,
      appType: app.app_type,
      repoUrl: app.repo_url,
      dockerfile: app.dockerfile,
      configFiles: app.config_files,
      healthCheckPath: app.health_check_path,
      preScript: app.pre_script,
      postScript: app.post_script,
      envVars: app.env_vars,
      description: app.description,
      ownerId: app.owner_id,
      ownerName: app.owner_name,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
      configs: configs.map(c => ({
        id: c.id,
        configName: c.config_name,
        configKey: c.config_key,
        environment: c.environment,
        configType: c.config_type,
        version: c.version,
      })),
      recentDeploys: recentDeploys.map(d => ({
        id: d.id,
        environment: d.environment,
        version: d.version,
        status: d.status,
        createdAt: d.created_at,
      })),
    }
  }
}

// 创建应用
export async function createApp(data: {
  appName: string
  appCode: string
  appType?: string
  repoUrl?: string
  dockerfile?: string
  configFiles?: string
  healthCheckPath?: string
  preScript?: string
  postScript?: string
  envVars?: string
  description?: string
  ownerId?: number
}): Promise<ApiResponse> {
  // 检查应用代码是否存在
  const existing = getOne(`
    SELECT id FROM apps WHERE app_code = ?
  `, [data.appCode])
  
  if (existing) {
    return { code: 409, message: '应用代码已存在' }
  }
  
  runQuery(`
    INSERT INTO apps (app_name, app_code, app_type, repo_url, dockerfile, config_files, 
                      health_check_path, pre_script, post_script, env_vars, description, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    data.appName,
    data.appCode,
    data.appType || 'docker',
    data.repoUrl || null,
    data.dockerfile || null,
    data.configFiles || null,
    data.healthCheckPath || null,
    data.preScript || null,
    data.postScript || null,
    data.envVars || null,
    data.description || null,
    data.ownerId || null
  ])
  
  const id = getLastInsertRowId()
  
  return {
    code: 200,
    message: '创建成功',
    data: { id }
  }
}

// 更新应用
export async function updateApp(
  id: number, 
  data: {
    appName?: string
    appType?: string
    repoUrl?: string
    dockerfile?: string
    configFiles?: string
    healthCheckPath?: string
    preScript?: string
    postScript?: string
    envVars?: string
    description?: string
    ownerId?: number
  }
): Promise<ApiResponse> {
  const app = getOne(`SELECT id FROM apps WHERE id = ?`, [id])
  if (!app) {
    return { code: 404, message: '应用不存在' }
  }
  
  const updates: string[] = []
  const params: any[] = []
  
  if (data.appName !== undefined) {
    updates.push('app_name = ?')
    params.push(data.appName)
  }
  if (data.appType !== undefined) {
    updates.push('app_type = ?')
    params.push(data.appType)
  }
  if (data.repoUrl !== undefined) {
    updates.push('repo_url = ?')
    params.push(data.repoUrl)
  }
  if (data.dockerfile !== undefined) {
    updates.push('dockerfile = ?')
    params.push(data.dockerfile)
  }
  if (data.configFiles !== undefined) {
    updates.push('config_files = ?')
    params.push(data.configFiles)
  }
  if (data.healthCheckPath !== undefined) {
    updates.push('health_check_path = ?')
    params.push(data.healthCheckPath)
  }
  if (data.preScript !== undefined) {
    updates.push('pre_script = ?')
    params.push(data.preScript)
  }
  if (data.postScript !== undefined) {
    updates.push('post_script = ?')
    params.push(data.postScript)
  }
  if (data.envVars !== undefined) {
    updates.push('env_vars = ?')
    params.push(data.envVars)
  }
  if (data.description !== undefined) {
    updates.push('description = ?')
    params.push(data.description)
  }
  if (data.ownerId !== undefined) {
    updates.push('owner_id = ?')
    params.push(data.ownerId)
  }
  
  if (updates.length === 0) {
    return { code: 200, message: '没有更新内容' }
  }
  
  params.push(id)
  runQuery(`
    UPDATE apps SET ${updates.join(', ')}, updated_at = datetime('now')
    WHERE id = ?
  `, params)
  
  return { code: 200, message: '更新成功' }
}

// 删除应用
export async function deleteApp(id: number): Promise<ApiResponse> {
  runQuery(`DELETE FROM apps WHERE id = ?`, [id])
  
  const changes = getChanges()
  if (changes === 0) {
    return { code: 404, message: '应用不存在' }
  }
  
  return { code: 200, message: '删除成功' }
}

export default {
  listApps,
  getAppById,
  createApp,
  updateApp,
  deleteApp,
}