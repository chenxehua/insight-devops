import { vi } from 'vitest'
import { http, HttpResponse } from 'msw'

// API 基础 URL
const BASE_URL = 'http://localhost:3000/api'

// 模拟用户数据
export const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    phone: '13800138000',
    realName: '管理员',
    status: 1,
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'testuser',
    email: 'test@example.com',
    phone: '13800138001',
    realName: '测试用户',
    status: 1,
    role: 'user',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
]

// 创建 API 处理器
export function createApiHandlers() {
  return [
    // 健康检查
    http.get(`${BASE_URL}/health`, () => {
      return HttpResponse.json({ status: 'ok' })
    }),

    // 认证
    http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
      const body = await request.json() as { username: string; password: string }
      if (body.username === 'admin' && body.password === 'admin123') {
        return HttpResponse.json({
          code: 200,
          message: '登录成功',
          data: {
            token: 'mock-jwt-token',
            refreshToken: 'mock-refresh-token',
            user: mockUsers[0],
          },
        })
      }
      return HttpResponse.json({
        code: 401,
        message: '用户名或密码错误',
      }, { status: 401 })
    }),

    http.post(`${BASE_URL}/auth/logout`, () => {
      return HttpResponse.json({
        code: 200,
        message: '登出成功',
      })
    }),

    http.get(`${BASE_URL}/auth/current`, () => {
      return HttpResponse.json({
        code: 200,
        data: mockUsers[0],
      })
    }),

    // 用户管理
    http.get(`${BASE_URL}/users`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: mockUsers,
          pagination: {
            page: 1,
            pageSize: 10,
            total: 2,
          },
        },
      })
    }),

    http.get(`${BASE_URL}/users/:id`, ({ params }) => {
      const id = Number(params.id)
      const user = mockUsers.find(u => u.id === id)
      if (user) {
        return HttpResponse.json({
          code: 200,
          data: user,
        })
      }
      return HttpResponse.json({
        code: 404,
        message: '用户不存在',
      }, { status: 404 })
    }),

    http.post(`${BASE_URL}/users`, async ({ request }) => {
      const body = await request.json() as Record<string, unknown>
      const newUser = {
        id: 3,
        ...body,
        status: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      return HttpResponse.json({
        code: 200,
        message: '创建成功',
        data: newUser,
      })
    }),

    http.put(`${BASE_URL}/users/:id`, async ({ request, params }) => {
      const id = Number(params.id)
      const body = await request.json() as Record<string, unknown>
      const user = mockUsers.find(u => u.id === id)
      if (user) {
        return HttpResponse.json({
          code: 200,
          message: '更新成功',
          data: { ...user, ...body },
        })
      }
      return HttpResponse.json({
        code: 404,
        message: '用户不存在',
      }, { status: 404 })
    }),

    http.delete(`${BASE_URL}/users/:id`, ({ params }) => {
      const id = Number(params.id)
      if (id > 0) {
        return HttpResponse.json({
          code: 200,
          message: '删除成功',
        })
      }
      return HttpResponse.json({
        code: 404,
        message: '用户不存在',
      }, { status: 404 })
    }),

    // 角色管理
    http.get(`${BASE_URL}/roles`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [
            { id: 1, name: 'admin', description: '管理员', permissions: [] },
            { id: 2, name: 'user', description: '普通用户', permissions: [] },
          ],
          pagination: { page: 1, pageSize: 10, total: 2 },
        },
      })
    }),

    // 应用管理
    http.get(`${BASE_URL}/apps`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [
            {
              id: 1,
              name: 'TestApp',
              appKey: 'test-app-key',
              appType: 'java',
              description: '测试应用',
              status: 1,
              createdAt: '2024-01-01T00:00:00Z',
            },
          ],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),

    http.post(`${BASE_URL}/apps`, async ({ request }) => {
      const body = await request.json() as Record<string, unknown>
      return HttpResponse.json({
        code: 200,
        message: '创建成功',
        data: { id: 2, ...body, status: 1 },
      })
    }),

    // 部署管理
    http.get(`${BASE_URL}/deploys`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [
            {
              id: 1,
              name: 'Test Deploy',
              appId: 1,
              environment: 'test',
              version: '1.0.0',
              status: 'success',
              createdAt: '2024-01-01T00:00:00Z',
            },
          ],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),

    http.post(`${BASE_URL}/deploys/:id/execute`, ({ params }) => {
      return HttpResponse.json({
        code: 200,
        message: '部署已启动',
        data: { deployId: params.id, status: 'running' },
      })
    }),

    http.post(`${BASE_URL}/deploys/:id/rollback`, ({ params }) => {
      return HttpResponse.json({
        code: 200,
        message: '回滚成功',
        data: { deployId: params.id, status: 'rollback_success' },
      })
    }),

    // 脚本管理
    http.get(`${BASE_URL}/scripts`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [
            {
              id: 1,
              name: 'Test Script',
              scriptType: 'shell',
              content: 'echo "Hello"',
              status: 1,
            },
          ],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),

    http.post(`${BASE_URL}/scripts/:id/execute`, ({ params }) => {
      return HttpResponse.json({
        code: 200,
        message: '执行成功',
        data: { scriptId: params.id, output: 'Hello', exitCode: 0 },
      })
    }),

    // 配置管理
    http.get(`${BASE_URL}/configs`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [
            { id: 1, key: 'app.config', value: '{}', environment: 'test' },
          ],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),

    // 监控管理
    http.get(`${BASE_URL}/monitors`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [
            { id: 1, name: 'CPU Monitor', targetType: 'host', status: 1 },
          ],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),

    // 日志管理
    http.get(`${BASE_URL}/logs`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [
            { id: 1, level: 'info', message: 'Test log', service: 'test-service' },
          ],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),

    // 故障管理
    http.get(`${BASE_URL}/faults`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [
            { id: 1, title: 'Test Fault', faultLevel: 'medium', status: 'pending' },
          ],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),

    // 镜像管理
    http.get(`${BASE_URL}/images`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [
            { id: 1, name: 'test-image:latest', repoId: 1, size: '100MB' },
          ],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),

    http.get(`${BASE_URL}/images/repos`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [{ id: 1, name: 'TestRepo', registry: 'docker.io' }],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),

    // 备份管理
    http.get(`${BASE_URL}/backups`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [
            { id: 1, databaseId: 1, backupType: 'full', status: 'success' },
          ],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),

    http.get(`${BASE_URL}/backups/databases`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [{ id: 1, name: 'TestDB', dbType: 'mysql' }],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),

    // 巡检管理
    http.get(`${BASE_URL}/checks`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [
            { id: 1, name: 'Health Check', taskType: 'health', status: 'pending' },
          ],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),

    http.get(`${BASE_URL}/checks/tasks`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [
            { id: 1, name: 'Health Check', taskType: 'health', status: 'pending' },
          ],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),

    http.get(`${BASE_URL}/checks/reports`, () => {
      return HttpResponse.json({
        code: 200,
        data: {
          list: [
            { id: 1, taskId: 1, status: 'success', score: 100 },
          ],
          pagination: { page: 1, pageSize: 10, total: 1 },
        },
      })
    }),
  ]
}

// 导出处理器
export const apiHandlers = createApiHandlers()