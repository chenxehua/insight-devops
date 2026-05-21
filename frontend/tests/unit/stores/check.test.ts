// Check Store 单元测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCheckStore } from '@/stores/check'

// Mock API
vi.mock('@/services/api', () => ({
  checkApi: {
    listTasks: vi.fn().mockResolvedValue({
      data: { list: [{ id: 1, name: 'Task 1' }], total: 1 }
    }),
    getTaskById: vi.fn().mockResolvedValue({
      data: { id: 1, name: 'Task 1' }
    }),
    createTask: vi.fn().mockResolvedValue({
      data: { id: 1 }
    }),
    updateTask: vi.fn().mockResolvedValue({
      data: { success: true }
    }),
    deleteTask: vi.fn().mockResolvedValue({
      data: { success: true }
    }),
    executeTask: vi.fn().mockResolvedValue({
      data: { success: true }
    }),
    getTaskReports: vi.fn().mockResolvedValue({
      data: { list: [{ id: 1, name: 'Report 1' }] }
    }),
    listReports: vi.fn().mockResolvedValue({
      data: { list: [{ id: 1, name: 'Report 1' }], total: 1 }
    }),
    getReportById: vi.fn().mockResolvedValue({
      data: { id: 1, name: 'Report 1' }
    }),
    updateReport: vi.fn().mockResolvedValue({
      data: { success: true }
    }),
  },
}))

describe('Check Store Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('State 初始化', () => {
    it('应该初始化默认状态', () => {
      const store = useCheckStore()
      expect(store.tasks).toEqual([])
      expect(store.currentTask).toBeNull()
      expect(store.reports).toEqual([])
      expect(store.currentReport).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('应该初始化分页配置', () => {
      const store = useCheckStore()
      expect(store.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 0,
      })
    })
  })

  describe('fetchTasks', () => {
    it('应该获取巡检任务列表', async () => {
      const store = useCheckStore()
      const result = await store.fetchTasks()

      expect(result.list).toHaveLength(1)
      expect(result.list[0].id).toBe(1)
      expect(store.tasks).toHaveLength(1)
      expect(store.loading).toBe(false)
    })

    it('应该设置loading状态', async () => {
      const store = useCheckStore()
      expect(store.loading).toBe(false)

      const promise = store.fetchTasks()
      expect(store.loading).toBe(true)

      await promise
      expect(store.loading).toBe(false)
    })

    it('应该更新分页总数', async () => {
      const store = useCheckStore()
      await store.fetchTasks()

      expect(store.pagination.total).toBe(1)
    })

    it('应该支持自定义参数', async () => {
      const store = useCheckStore()
      await store.fetchTasks({ status: 'pending' })

      const { checkApi } = await import('@/services/api')
      expect(checkApi.listTasks).toHaveBeenCalled()
    })
  })

  describe('getTaskById', () => {
    it('应该获取任务详情', async () => {
      const store = useCheckStore()
      const result = await store.getTaskById(1)

      expect(result.id).toBe(1)
      expect(store.currentTask).toEqual({ id: 1, name: 'Task 1' })
    })

    it('应该设置loading状态', async () => {
      const store = useCheckStore()
      expect(store.loading).toBe(false)

      const promise = store.getTaskById(1)
      expect(store.loading).toBe(true)

      await promise
      expect(store.loading).toBe(false)
    })
  })

  describe('createTask', () => {
    it('应该创建新任务', async () => {
      const store = useCheckStore()
      const result = await store.createTask({ name: 'New Task' })

      expect(result.id).toBe(1)
    })
  })

  describe('updateTask', () => {
    it('应该更新任务', async () => {
      const store = useCheckStore()
      const result = await store.updateTask(1, { name: 'Updated Task' })

      expect(result.success).toBe(true)
    })
  })

  describe('deleteTask', () => {
    it('应该删除任务', async () => {
      const store = useCheckStore()
      const result = await store.deleteTask(1)

      expect(result.success).toBe(true)
    })
  })

  describe('executeTask', () => {
    it('应该执行任务', async () => {
      const store = useCheckStore()
      const result = await store.executeTask(1)

      expect(result.success).toBe(true)
    })
  })

  describe('getTaskReports', () => {
    it('应该获取任务报告列表', async () => {
      const store = useCheckStore()
      const result = await store.getTaskReports(1)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
    })
  })

  describe('fetchReports', () => {
    it('应该获取巡检报告列表', async () => {
      const store = useCheckStore()
      const result = await store.fetchReports()

      expect(result.list).toHaveLength(1)
      expect(store.reports).toHaveLength(1)
    })

    it('应该更新分页总数', async () => {
      const store = useCheckStore()
      await store.fetchReports()

      expect(store.pagination.total).toBe(1)
    })
  })

  describe('getReportById', () => {
    it('应该获取报告详情', async () => {
      const store = useCheckStore()
      const result = await store.getReportById(1)

      expect(result.id).toBe(1)
      expect(store.currentReport).toEqual({ id: 1, name: 'Report 1' })
    })
  })

  describe('updateReport', () => {
    it('应该更新报告', async () => {
      const store = useCheckStore()
      const result = await store.updateReport(1, { status: 'approved' })

      expect(result.success).toBe(true)
    })
  })

  describe('分页操作', () => {
    it('setPage 应该设置当前页', () => {
      const store = useCheckStore()
      store.setPage(3)
      expect(store.pagination.page).toBe(3)
    })

    it('setPageSize 应该设置页面大小', () => {
      const store = useCheckStore()
      store.setPageSize(50)
      expect(store.pagination.pageSize).toBe(50)
    })
  })
})