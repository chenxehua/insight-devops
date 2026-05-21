import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDeployStore } from '@/stores/deploy'

// Mock API
vi.mock('@/services/api', () => ({
  deployApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
    cancel: vi.fn(),
    rollback: vi.fn(),
    getLogs: vi.fn(),
  },
}))

import { deployApi } from '@/services/api'

describe('Deploy Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('应该初始化默认值', () => {
    const store = useDeployStore()
    expect(store.tasks).toEqual([])
    expect(store.currentTask).toBe(null)
    expect(store.loading).toBe(false)
    expect(store.pagination.page).toBe(1)
    expect(store.pagination.pageSize).toBe(20)
    expect(store.pagination.total).toBe(0)
  })

  describe('fetchTasks', () => {
    it('应该获取部署任务列表', async () => {
      const mockData = {
        code: 200,
        data: {
          list: [{ id: 1, appName: 'Test App', status: 'success' }],
          total: 1,
        },
      }
      ;(deployApi.list as any).mockResolvedValue(mockData)

      const store = useDeployStore()
      const result = await store.fetchTasks()

      expect(deployApi.list).toHaveBeenCalled()
      expect(store.tasks).toEqual(mockData.data.list)
      expect(store.pagination.total).toBe(1)
      expect(result).toEqual(mockData.data)
    })

    it('应该处理加载状态', async () => {
      const mockData = { code: 200, data: { list: [], total: 0 } }
      ;(deployApi.list as any).mockResolvedValue(mockData)

      const store = useDeployStore()
      expect(store.loading).toBe(false)

      const promise = store.fetchTasks()
      expect(store.loading).toBe(true)

      await promise
      expect(store.loading).toBe(false)
    })

    it('应该支持筛选参数', async () => {
      const mockData = { code: 200, data: { list: [], total: 0 } }
      ;(deployApi.list as any).mockResolvedValue(mockData)

      const store = useDeployStore()
      await store.fetchTasks({ appId: 1, environment: 'prod', status: 'success' })

      expect(deployApi.list).toHaveBeenCalledWith(expect.objectContaining({
        appId: 1,
        environment: 'prod',
        status: 'success',
      }))
    })
  })

  describe('getTaskById', () => {
    it('应该获取任务详情', async () => {
      const mockTask = { id: 1, appName: 'Test App', status: 'success' }
      const mockData = { code: 200, data: mockTask }
      ;(deployApi.getById as any).mockResolvedValue(mockData)

      const store = useDeployStore()
      const result = await store.getTaskById(1)

      expect(deployApi.getById).toHaveBeenCalledWith(1)
      expect(store.currentTask).toEqual(mockTask)
      expect(result).toEqual(mockTask)
    })
  })

  describe('createTask', () => {
    it('应该创建部署任务', async () => {
      const mockData = { code: 200, data: { id: 1 } }
      ;(deployApi.create as any).mockResolvedValue(mockData)

      const store = useDeployStore()
      const data = { appId: 1, environment: 'dev', version: 'v1.0.0' }
      const result = await store.createTask(data)

      expect(deployApi.create).toHaveBeenCalledWith(data)
      expect(result).toEqual(mockData.data)
    })

    it('应该支持部署策略', async () => {
      const mockData = { code: 200, data: { id: 2 } }
      ;(deployApi.create as any).mockResolvedValue(mockData)

      const store = useDeployStore()
      const data = { appId: 1, environment: 'prod', version: 'v1.0.0', strategy: 'canary' }
      await store.createTask(data)

      expect(deployApi.create).toHaveBeenCalledWith(expect.objectContaining({
        strategy: 'canary',
      }))
    })
  })

  describe('executeTask', () => {
    it('应该执行部署任务', async () => {
      const mockData = { code: 200, message: '部署任务已启动', data: { status: 'running' } }
      ;(deployApi.execute as any).mockResolvedValue(mockData)

      const store = useDeployStore()
      const result = await store.executeTask(1)

      expect(deployApi.execute).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockData.data)
    })

    it('执行失败应抛出错误', async () => {
      ;(deployApi.execute as any).mockRejectedValue(new Error('Execute failed'))

      const store = useDeployStore()
      await expect(store.executeTask(1)).rejects.toThrow('Execute failed')
    })
  })

  describe('rollbackTask', () => {
    it('应该回滚部署任务', async () => {
      const mockData = { code: 200, message: '回滚任务已启动', data: { status: 'rollback' } }
      ;(deployApi.rollback as any).mockResolvedValue(mockData)

      const store = useDeployStore()
      const result = await store.rollbackTask(1)

      expect(deployApi.rollback).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockData.data)
    })
  })

  describe('分页方法', () => {
    it('setPage 应该更新页码', () => {
      const store = useDeployStore()
      store.setPage(2)
      expect(store.pagination.page).toBe(2)
    })

    it('setPageSize 应该更新每页大小', () => {
      const store = useDeployStore()
      store.setPageSize(50)
      expect(store.pagination.pageSize).toBe(50)
    })

    it('分页参数应该影响API调用', async () => {
      const mockData = { code: 200, data: { list: [], total: 0 } }
      ;(deployApi.list as any).mockResolvedValue(mockData)

      const store = useDeployStore()
      store.setPage(2)
      store.setPageSize(10)
      await store.fetchTasks()

      expect(deployApi.list).toHaveBeenCalledWith(expect.objectContaining({
        page: 2,
        pageSize: 10,
      }))
    })
  })
})