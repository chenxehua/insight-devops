// Log Store 单元测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLogStore } from '@/stores/log'

// Mock API
vi.mock('@/services/api', () => ({
  logApi: {
    list: vi.fn().mockResolvedValue({
      data: { list: [{ id: 1, message: 'Log 1' }], total: 1 }
    }),
    getById: vi.fn().mockResolvedValue({
      data: { id: 1, message: 'Log 1' }
    }),
    create: vi.fn().mockResolvedValue({
      data: { id: 1 }
    }),
    clear: vi.fn().mockResolvedValue({
      data: { success: true }
    }),
    getStats: vi.fn().mockResolvedValue({
      data: { total: 100, errorCount: 10 }
    }),
  },
}))

describe('Log Store Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('State 初始化', () => {
    it('应该初始化默认状态', () => {
      const store = useLogStore()
      expect(store.logs).toEqual([])
      expect(store.logStats).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('应该初始化分页配置', () => {
      const store = useLogStore()
      expect(store.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 0,
      })
    })
  })

  describe('fetchLogs', () => {
    it('应该获取日志列表', async () => {
      const store = useLogStore()
      const result = await store.fetchLogs()

      expect(result.list).toHaveLength(1)
      expect(result.list[0].id).toBe(1)
      expect(store.logs).toHaveLength(1)
      expect(store.loading).toBe(false)
    })

    it('应该设置loading状态', async () => {
      const store = useLogStore()
      expect(store.loading).toBe(false)

      const promise = store.fetchLogs()
      expect(store.loading).toBe(true)

      await promise
      expect(store.loading).toBe(false)
    })

    it('应该更新分页总数', async () => {
      const store = useLogStore()
      await store.fetchLogs()

      expect(store.pagination.total).toBe(1)
    })

    it('应该支持自定义参数', async () => {
      const store = useLogStore()
      await store.fetchLogs({ level: 'error' })

      const { logApi } = await import('@/services/api')
      expect(logApi.list).toHaveBeenCalled()
    })
  })

  describe('getLogById', () => {
    it('应该获取日志详情', async () => {
      const store = useLogStore()
      const result = await store.getLogById(1)

      expect(result.id).toBe(1)
    })
  })

  describe('createLog', () => {
    it('应该创建新日志', async () => {
      const store = useLogStore()
      const result = await store.createLog({ message: 'New Log' })

      expect(result.id).toBe(1)
    })
  })

  describe('clearLogs', () => {
    it('应该清理日志', async () => {
      const store = useLogStore()
      const result = await store.clearLogs(30)

      expect(result.success).toBe(true)
    })

    it('应该支持自定义天数', async () => {
      const store = useLogStore()
      await store.clearLogs(7)

      const { logApi } = await import('@/services/api')
      expect(logApi.clear).toHaveBeenCalled()
    })
  })

  describe('getStats', () => {
    it('应该获取日志统计', async () => {
      const store = useLogStore()
      const result = await store.getStats()

      expect(result.total).toBe(100)
      expect(store.logStats).toEqual({ total: 100, errorCount: 10 })
    })

    it('应该支持自定义参数', async () => {
      const store = useLogStore()
      await store.getStats({ timeRange: 'today' })

      const { logApi } = await import('@/services/api')
      expect(logApi.getStats).toHaveBeenCalled()
    })
  })

  describe('分页操作', () => {
    it('setPage 应该设置当前页', () => {
      const store = useLogStore()
      store.setPage(3)
      expect(store.pagination.page).toBe(3)
    })

    it('setPageSize 应该设置页面大小', () => {
      const store = useLogStore()
      store.setPageSize(50)
      expect(store.pagination.pageSize).toBe(50)
    })
  })
})