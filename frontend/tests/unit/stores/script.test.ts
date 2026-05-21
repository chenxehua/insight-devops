import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScriptStore } from '@/stores/script'

// Mock API
vi.mock('@/services/api', () => ({
  scriptApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getVersions: vi.fn(),
    execute: vi.fn(),
    getExecutions: vi.fn(),
    getExecutionById: vi.fn(),
  },
}))

import { scriptApi } from '@/services/api'

describe('Script Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('应该初始化默认值', () => {
    const store = useScriptStore()
    expect(store.scripts).toEqual([])
    expect(store.currentScript).toBe(null)
    expect(store.scriptVersions).toEqual([])
    expect(store.scriptExecutions).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.pagination.page).toBe(1)
    expect(store.pagination.pageSize).toBe(20)
    expect(store.pagination.total).toBe(0)
  })

  describe('fetchScripts', () => {
    it('应该获取脚本列表', async () => {
      const mockData = {
        code: 200,
        data: {
          list: [{ id: 1, scriptName: 'Test Script', scriptType: 'bash' }],
          total: 1,
        },
      }
      ;(scriptApi.list as any).mockResolvedValue(mockData)

      const store = useScriptStore()
      const result = await store.fetchScripts()

      expect(scriptApi.list).toHaveBeenCalled()
      expect(store.scripts).toEqual(mockData.data.list)
      expect(store.pagination.total).toBe(1)
      expect(result).toEqual(mockData.data)
    })

    it('应该支持搜索参数', async () => {
      const mockData = { code: 200, data: { list: [], total: 0 } }
      ;(scriptApi.list as any).mockResolvedValue(mockData)

      const store = useScriptStore()
      await store.fetchScripts({ keyword: 'deploy', scriptType: 'bash', category: 'deployment' })

      expect(scriptApi.list).toHaveBeenCalledWith(expect.objectContaining({
        keyword: 'deploy',
        scriptType: 'bash',
        category: 'deployment',
      }))
    })

    it('应该处理加载状态', async () => {
      const mockData = { code: 200, data: { list: [], total: 0 } }
      ;(scriptApi.list as any).mockResolvedValue(mockData)

      const store = useScriptStore()
      expect(store.loading).toBe(false)

      const promise = store.fetchScripts()
      expect(store.loading).toBe(true)

      await promise
      expect(store.loading).toBe(false)
    })
  })

  describe('getScriptById', () => {
    it('应该获取脚本详情', async () => {
      const mockScript = { id: 1, scriptName: 'Test Script', content: 'echo "test"' }
      const mockData = { code: 200, data: mockScript }
      ;(scriptApi.getById as any).mockResolvedValue(mockData)

      const store = useScriptStore()
      const result = await store.getScriptById(1)

      expect(scriptApi.getById).toHaveBeenCalledWith(1)
      expect(store.currentScript).toEqual(mockScript)
      expect(result).toEqual(mockScript)
    })
  })

  describe('createScript', () => {
    it('应该创建脚本', async () => {
      const mockData = { code: 200, data: { id: 1 } }
      ;(scriptApi.create as any).mockResolvedValue(mockData)

      const store = useScriptStore()
      const data = { scriptName: 'New Script', scriptCode: 'new-script', scriptType: 'bash', content: 'echo "test"' }
      const result = await store.createScript(data)

      expect(scriptApi.create).toHaveBeenCalledWith(data)
      expect(result).toEqual(mockData.data)
    })
  })

  describe('updateScript', () => {
    it('应该更新脚本', async () => {
      const mockData = { code: 200 }
      ;(scriptApi.update as any).mockResolvedValue(mockData)

      const store = useScriptStore()
      const data = { scriptName: 'Updated Script' }
      await store.updateScript(1, data)

      expect(scriptApi.update).toHaveBeenCalledWith(1, data)
    })
  })

  describe('deleteScript', () => {
    it('应该删除脚本', async () => {
      const mockData = { code: 200 }
      ;(scriptApi.delete as any).mockResolvedValue(mockData)

      const store = useScriptStore()
      await store.deleteScript(1)

      expect(scriptApi.delete).toHaveBeenCalledWith(1)
    })
  })

  describe('getVersions', () => {
    it('应该获取脚本版本历史', async () => {
      const mockVersions = [
        { id: 1, version: 2, content: 'v2', createdAt: '2024-01-02' },
        { id: 2, version: 1, content: 'v1', createdAt: '2024-01-01' },
      ]
      const mockData = { code: 200, data: mockVersions }
      ;(scriptApi.getVersions as any).mockResolvedValue(mockData)

      const store = useScriptStore()
      const result = await store.getVersions(1)

      expect(scriptApi.getVersions).toHaveBeenCalledWith(1)
      expect(store.scriptVersions).toEqual(mockVersions)
      expect(result).toEqual(mockVersions)
    })
  })

  describe('executeScript', () => {
    it('应该执行脚本', async () => {
      const mockData = { code: 200, data: { id: 100, status: 'pending' } }
      ;(scriptApi.execute as any).mockResolvedValue(mockData)

      const store = useScriptStore()
      const result = await store.executeScript(1, { params: { arg: 'value' }, targetHost: 'localhost' })

      expect(scriptApi.execute).toHaveBeenCalledWith(1, { params: { arg: 'value' }, targetHost: 'localhost' })
      expect(result).toEqual(mockData.data)
    })

    it('应该支持无参数执行', async () => {
      const mockData = { code: 200, data: { id: 101, status: 'pending' } }
      ;(scriptApi.execute as any).mockResolvedValue(mockData)

      const store = useScriptStore()
      await store.executeScript(1)

      expect(scriptApi.execute).toHaveBeenCalledWith(1, undefined)
    })
  })

  describe('getExecutions', () => {
    it('应该获取执行记录列表', async () => {
      const mockExecutions = [
        { id: 1, scriptId: 1, status: 'success', output: 'done' },
        { id: 2, scriptId: 1, status: 'failed', errorOutput: 'error' },
      ]
      const mockData = {
        code: 200,
        data: {
          list: mockExecutions,
          total: 2,
        },
      }
      ;(scriptApi.getExecutions as any).mockResolvedValue(mockData)

      const store = useScriptStore()
      const result = await store.getExecutions(1, { page: 1, pageSize: 20 })

      expect(scriptApi.getExecutions).toHaveBeenCalledWith(1, { page: 1, pageSize: 20 })
      expect(store.scriptExecutions).toEqual(mockExecutions)
      expect(result).toEqual(mockData.data)
    })
  })

  describe('分页方法', () => {
    it('setPage 应该更新页码', () => {
      const store = useScriptStore()
      store.setPage(3)
      expect(store.pagination.page).toBe(3)
    })

    it('setPageSize 应该更新每页大小', () => {
      const store = useScriptStore()
      store.setPageSize(50)
      expect(store.pagination.pageSize).toBe(50)
    })
  })
})