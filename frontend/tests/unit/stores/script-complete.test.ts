/**
 * 脚本管理 Store 完整测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScriptStore } from '@/stores/script'

// Mock API
vi.mock('@/services/api', () => ({
  scriptApi: {
    list: vi.fn().mockResolvedValue({ data: { list: [], total: 0 } }),
    getById: vi.fn().mockResolvedValue({ data: null }),
    create: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    delete: vi.fn().mockResolvedValue({ message: '删除成功' }),
    execute: vi.fn().mockResolvedValue({ data: { id: 1, status: 'running' } }),
    getVersions: vi.fn().mockResolvedValue({ data: [] }),
    getExecutions: vi.fn().mockResolvedValue({ data: { list: [], total: 0 } }),
  }
}))

import { scriptApi } from '@/services/api'

describe('脚本管理 Store 完整测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('应该能创建脚本Store实例', () => {
    const store = useScriptStore()
    expect(store).toBeDefined()
    expect(store.scripts).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('应该能获取脚本列表', async () => {
    const store = useScriptStore()
    const mockData = {
      data: {
        list: [
          { id: 1, name: 'deploy-script', type: 'bash', category: 'deploy' },
          { id: 2, name: 'backup-script', type: 'python', category: 'backup' }
        ],
        total: 2
      }
    }
    
    vi.mocked(scriptApi.list).mockResolvedValue(mockData)
    
    await store.fetchScripts()
    
    expect(store.scripts).toHaveLength(2)
    expect(store.loading).toBe(false)
  })

  it('应该能获取单个脚本详情', async () => {
    const store = useScriptStore()
    const mockScript = { id: 1, name: 'test-script', content: 'echo hello' }
    
    vi.mocked(scriptApi.getById).mockResolvedValue({ data: mockScript })
    
    const script = await store.getScriptById(1)
    
    expect(script).toEqual(mockScript)
  })

  it('应该能创建新脚本', async () => {
    const store = useScriptStore()
    const scriptData = { name: 'new-script', type: 'bash', content: 'echo hello' }
    
    vi.mocked(scriptApi.create).mockResolvedValue({ data: { id: 3, ...scriptData } })
    
    const result = await store.createScript(scriptData)
    
    expect(result.id).toBe(3)
  })

  it('应该能更新脚本', async () => {
    const store = useScriptStore()
    const updateData = { name: 'updated-script' }
    
    vi.mocked(scriptApi.update).mockResolvedValue({ data: { id: 1, ...updateData } })
    
    const result = await store.updateScript(1, updateData)
    
    expect(result.name).toBe('updated-script')
  })

  it('应该能删除脚本', async () => {
    const store = useScriptStore()
    
    vi.mocked(scriptApi.delete).mockResolvedValue({ message: '删除成功' })
    
    await store.deleteScript(1)
    
    expect(scriptApi.delete).toHaveBeenCalledWith(1)
  })

  it('应该能执行脚本', async () => {
    const store = useScriptStore()
    
    vi.mocked(scriptApi.execute).mockResolvedValue({ data: { id: 1, status: 'running' } })
    
    const result = await store.executeScript(1)
    
    expect(result.status).toBe('running')
  })

  it('应该能获取脚本版本历史', async () => {
    const store = useScriptStore()
    const mockVersions = [
      { id: 1, version: 'v1.0', content: 'echo hello' },
      { id: 2, version: 'v0.9', content: 'echo world' }
    ]
    
    vi.mocked(scriptApi.getVersions).mockResolvedValue({ data: mockVersions })
    
    const versions = await store.getVersions(1)
    
    expect(versions).toHaveLength(2)
  })

  it('应该能获取脚本执行记录', async () => {
    const store = useScriptStore()
    const mockData = {
      data: {
        list: [
          { id: 1, scriptId: 1, status: 'success' },
          { id: 2, scriptId: 1, status: 'failed' }
        ],
        total: 2
      }
    }
    
    vi.mocked(scriptApi.getExecutions).mockResolvedValue(mockData)
    
    const result = await store.getExecutions(1)
    
    expect(result.list).toHaveLength(2)
  })

  it('应该处理API错误', async () => {
    const store = useScriptStore()
    
    vi.mocked(scriptApi.list).mockRejectedValue(new Error('Network Error'))
    
    await expect(store.fetchScripts()).rejects.toThrow('Network Error')
  })

  it('应该能设置页码', () => {
    const store = useScriptStore()
    
    store.setPage(2)
    
    expect(store.pagination.page).toBe(2)
  })

  it('应该能设置每页数量', () => {
    const store = useScriptStore()
    
    store.setPageSize(50)
    
    expect(store.pagination.pageSize).toBe(50)
  })
})