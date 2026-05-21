// API服务层
import axios, { AxiosInstance, AxiosError } from 'axios'
import { message } from 'ant-design-vue'

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 200 && res.code !== 404) {
      message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          break
        case 403:
          message.error('没有权限访问')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器内部错误')
          break
        default:
          message.error(error.message || '请求失败')
      }
    } else {
      message.error('网络连接失败')
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (username: string, password: string) => 
    api.post('/auth/login', { username, password }),
  register: (data: { username: string; password: string; email: string }) => 
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/current'),
  refreshToken: (refreshToken: string) => 
    api.post('/auth/refresh', { refreshToken }),
}

// User API
export const userApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; status?: number }) => 
    api.get('/users', { params }),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  changePassword: (id: number, oldPassword: string, newPassword: string) => 
    api.put(`/users/${id}/password`, { oldPassword, newPassword }),
}

// Role API
export const roleApi = {
  list: (params?: { page?: number; pageSize?: number }) => 
    api.get('/roles', { params }),
  getById: (id: number) => api.get(`/roles/${id}`),
  create: (data: any) => api.post('/roles', data),
  update: (id: number, data: any) => api.put(`/roles/${id}`, data),
  delete: (id: number) => api.delete(`/roles/${id}`),
}

// App API
export const appApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; appType?: string }) => 
    api.get('/apps', { params }),
  getById: (id: number) => api.get(`/apps/${id}`),
  create: (data: any) => api.post('/apps', data),
  update: (id: number, data: any) => api.put(`/apps/${id}`, data),
  delete: (id: number) => api.delete(`/apps/${id}`),
}

// Deploy API
export const deployApi = {
  list: (params?: { page?: number; pageSize?: number; appId?: number; environment?: string; status?: string }) => 
    api.get('/deploys', { params }),
  getById: (id: number) => api.get(`/deploys/${id}`),
  create: (data: any) => api.post('/deploys', data),
  update: (id: number, data: any) => api.put(`/deploys/${id}`, data),
  delete: (id: number) => api.delete(`/deploys/${id}`),
  execute: (id: number) => api.post(`/deploys/${id}/execute`),
  cancel: (id: number) => api.post(`/deploys/${id}/cancel`),
  rollback: (id: number) => api.post(`/deploys/${id}/rollback`),
  getLogs: (id: number) => api.get(`/deploys/${id}/logs`),
}

// Script API
export const scriptApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; scriptType?: string; category?: string }) => 
    api.get('/scripts', { params }),
  getById: (id: number) => api.get(`/scripts/${id}`),
  create: (data: any) => api.post('/scripts', data),
  update: (id: number, data: any) => api.put(`/scripts/${id}`, data),
  delete: (id: number) => api.delete(`/scripts/${id}`),
  getVersions: (id: number) => api.get(`/scripts/${id}/versions`),
  execute: (id: number, params?: { params?: any; targetHost?: string }) => 
    api.post(`/scripts/${id}/execute`, params || {}),
  getExecutions: (id: number, params?: { page?: number; pageSize?: number }) => 
    api.get(`/scripts/${id}/executions`, { params }),
  getExecutionById: (execId: number) => api.get(`/scripts/executions/${execId}`),
}

// Config API
export const configApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; appId?: number; environment?: string }) => 
    api.get('/configs', { params }),
  getById: (id: number) => api.get(`/configs/${id}`),
  create: (data: any) => api.post('/configs', data),
  update: (id: number, data: any) => api.put(`/configs/${id}`, data),
  delete: (id: number) => api.delete(`/configs/${id}`),
  getVersions: (id: number) => api.get(`/configs/${id}/versions`),
  rollback: (id: number, targetVersion: number) => api.post(`/configs/${id}/rollback`, { targetVersion }),
  getDiff: (id: number, from?: number, to?: number) => 
    api.get(`/configs/${id}/diff`, { params: { from, to } }),
}

// Monitor API
export const monitorApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; targetType?: string; status?: number }) => 
    api.get('/monitors', { params }),
  getById: (id: number) => api.get(`/monitors/${id}`),
  create: (data: any) => api.post('/monitors', data),
  update: (id: number, data: any) => api.put(`/monitors/${id}`, data),
  delete: (id: number) => api.delete(`/monitors/${id}`),
  getMetrics: (id: number, params?: { startTime?: string; endTime?: string; limit?: number }) => 
    api.get(`/monitors/${id}/metrics`, { params }),
  reportMetric: (id: number, value: number, timestamp?: string) => 
    api.post(`/monitors/${id}/metrics`, { value, timestamp }),
}

// Alert API
export const alertApi = {
  listRules: (params?: { page?: number; pageSize?: number }) => 
    api.get('/monitors/alerts/rules', { params }),
  createRule: (data: any) => api.post('/monitors/alerts/rules', data),
  updateRule: (id: number, data: any) => api.put(`/monitors/alerts/rules/${id}`, data),
  deleteRule: (id: number) => api.delete(`/monitors/alerts/rules/${id}`),
  list: (params?: { page?: number; pageSize?: number; status?: string; alertLevel?: string }) => 
    api.get('/monitors/alerts', { params }),
  handle: (id: number, data: { status?: string; handleNote?: string }) => 
    api.put(`/monitors/alerts/${id}/handle`, data),
}

// Log API
export const logApi = {
  list: (params?: { page?: number; pageSize?: number; level?: string; service?: string; keyword?: string; startTime?: string; endTime?: string }) => 
    api.get('/logs', { params }),
  getById: (id: number) => api.get(`/logs/${id}`),
  create: (data: any) => api.post('/logs', data),
  clear: (days?: number) => api.delete('/logs', { data: { days } }),
  getStats: (params?: { startTime?: string; endTime?: string; service?: string }) => 
    api.get('/logs/stats', { params }),
}

// Fault API
export const faultApi = {
  list: (params?: { page?: number; pageSize?: number; status?: string; faultLevel?: string; keyword?: string }) => 
    api.get('/faults', { params }),
  getById: (id: number) => api.get(`/faults/${id}`),
  create: (data: any) => api.post('/faults', data),
  update: (id: number, data: any) => api.put(`/faults/${id}`, data),
  delete: (id: number) => api.delete(`/faults/${id}`),
}

// Image API
export const imageApi = {
  listRepos: (params?: { page?: number; pageSize?: number; keyword?: string; repoType?: string }) => 
    api.get('/images/repos', { params }),
  getRepoById: (id: number) => api.get(`/images/repos/${id}`),
  createRepo: (data: any) => api.post('/images/repos', data),
  updateRepo: (id: number, data: any) => api.put(`/images/repos/${id}`, data),
  deleteRepo: (id: number) => api.delete(`/images/repos/${id}`),
  list: (params?: { page?: number; pageSize?: number; keyword?: string; repoId?: number; scanStatus?: string }) => 
    api.get('/images', { params }),
  getById: (id: number) => api.get(`/images/${id}`),
  create: (data: any) => api.post('/images', data),
  update: (id: number, data: any) => api.put(`/images/${id}`, data),
  delete: (id: number) => api.delete(`/images/${id}`),
}

// Backup API
export const backupApi = {
  listDatabases: (params?: { page?: number; pageSize?: number; keyword?: string; dbType?: string }) => 
    api.get('/backups/databases', { params }),
  createDatabase: (data: any) => api.post('/backups/databases', data),
  updateDatabase: (id: number, data: any) => api.put(`/backups/databases/${id}`, data),
  deleteDatabase: (id: number) => api.delete(`/backups/databases/${id}`),
  list: (params?: { page?: number; pageSize?: number; databaseId?: number; backupType?: string; status?: string }) => 
    api.get('/backups', { params }),
  getById: (id: number) => api.get(`/backups/${id}`),
  create: (data: { databaseId: number; backupType: string }) => api.post('/backups', data),
  update: (id: number, data: any) => api.put(`/backups/${id}`, data),
  delete: (id: number) => api.delete(`/backups/${id}`),
  restore: (id: number) => api.post(`/backups/${id}/restore`),
}

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getTrend: (days?: number) => api.get('/dashboard/trend', { params: { days } }),
}

// Check API
export const checkApi = {
  listTasks: (params?: { page?: number; pageSize?: number; keyword?: string; taskType?: string; status?: string }) => 
    api.get('/checks/tasks', { params }),
  getTaskById: (id: number) => api.get(`/checks/tasks/${id}`),
  createTask: (data: any) => api.post('/checks/tasks', data),
  updateTask: (id: number, data: any) => api.put(`/checks/tasks/${id}`, data),
  deleteTask: (id: number) => api.delete(`/checks/tasks/${id}`),
  executeTask: (id: number) => api.post(`/checks/tasks/${id}/execute`),
  getTaskReports: (id: number, params?: { page?: number; pageSize?: number }) => 
    api.get(`/checks/tasks/${id}/reports`, { params }),
  listReports: (params?: { page?: number; pageSize?: number; taskId?: number; status?: string }) => 
    api.get('/checks/reports', { params }),
  getReportById: (id: number) => api.get(`/checks/reports/${id}`),
  updateReport: (id: number, data: any) => api.put(`/checks/reports/${id}`, data),
}

export default api