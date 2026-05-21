/**
 * 部署管理 Store 完整测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDeployStore } from '@/stores/deploy'

// Mock API
vi.mock('@/services/api', () => ({
  deployApi: {
    list: vi.fn().mockResolvedValue({ data: { list: [], total: 0 } }),
    getById: vi.fn().mockResolvedValue({ data: null }),
    create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    delete: vi.fn().mockResolvedValue({ message: '删除成功' }),
    execute: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    rollback: vi.fn().mockResolvedValue({ data: { id: 1 } }),
  }
}))

import { deployApi } from '@/services/api'

describe('部署管理 Store 完整测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('应该能创建部署Store实例', () => {
    const store = useDeployStore()
    expect(store).toBeDefined()
    expect(store.tasks).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('应该能获取部署任务列表', async () => {
    const store = useDeployStore()
    const mockData = {
      data: {
        list: [
          { id: 1, name: 'deploy-1', status: 'success', environment: 'prod' },
          { id: 2, name: 'deploy-2', status: 'failed', environment: 'test' }
        ],
        total: 2
      }
    }
    
    vi.mocked(deployApi.list).mockResolvedValue(mockData)
    
    await store.fetchTasks()
    
    expect(store.tasks).toHaveLength(2)
    expect(store.loading).toBe(false)
  })

  it('应该能获取单个任务详情', async () => {
    const store = useDeployStore()
    const mockTask = { id: 1, name: 'deploy-1', status: 'running' }
    
    vi.mocked(deployApi.getById).mockResolvedValue({ data: mockTask })
    
    const task = await store.getTaskById(1)
    
    expect(task).toEqual(mockTask)
  })

  it('应该能创建新部署任务', async () => {
    const store = useDeployStore()
    const taskData = { name: 'new-deploy', environment: 'prod' }
    
    vi.mocked(deployApi.create).mockResolvedValue({ data: { id: 3, ...taskData } })
    
    const result = await store.createTask(taskData)
    
    expect(result.id).toBe(3)
  })

  it('应该能更新部署任务', async () => {
    const store = useDeployStore()
    const updateData = { name: 'updated-deploy' }
    
    vi.mocked(deployApi.update).mockResolvedValue({ data: { id: 1, ...updateData } })
    
    const result = await store.updateTask(1, updateData)
    
    expect(result.name).toBe('updated-deploy')
  })

  it('应该能删除部署任务', async () => {
    const store = useDeployStore()
    
    vi.mocked(deployApi.delete).mockResolvedValue({ message: '删除成功' })
    
    await store.deleteTask(1)
    
    expect(deployApi.delete).toHaveBeenCalledWith(1)
  })

  it('应该能执行部署任务', async () => {
    const store = useDeployStore()
    
    vi.mocked(deployApi.execute).mockResolvedValue({ data: { id: 1, status: 'running' } })
    
    const result = await store.executeTask(1)
    
    expect(result.status).toBe('running')
  })

  it('应该能回滚部署任务', async () => {
    const store = useDeployStore()
    
    vi.mocked(deployApi.rollback).mockResolvedValue({ message: '回滚成功' })
    
    await store.rollbackTask(1)
    
    expect(deployApi.rollback).toHaveBeenCalledWith(1)
  })

  it('应该处理API错误', async () => {
    const store = useDeployStore()
    
    vi.mocked(deployApi.list).mockRejectedValue(new Error('Network Error'))
    
    await expect(store.fetchTasks()).rejects.toThrow('Network Error')
  })

  it('应该能设置页码', () => {
    const store = useDeployStore()
    
    store.setPage(2)
    
    expect(store.pagination.page).toBe(2)
  })

  it('应该能设置每页数量', () => {
    const store = useDeployStore()
    
    store.setPageSize(50)
    
    expect(store.pagination.pageSize).toBe(50)
  })
})