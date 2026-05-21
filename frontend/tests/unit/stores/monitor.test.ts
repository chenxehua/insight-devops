import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMonitorStore } from '@/stores/monitor'

// Mock API
vi.mock('@/services/api', () => ({
  monitorApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getMetrics: vi.fn(),
    reportMetric: vi.fn(),
  },
  alertApi: {
    listRules: vi.fn(),
    createRule: vi.fn(),
    updateRule: vi.fn(),
    deleteRule: vi.fn(),
    list: vi.fn(),
    handle: vi.fn(),
  },
}))

import { monitorApi, alertApi } from '@/services/api'

describe('Monitor Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('应该初始化默认值', () => {
    const store = useMonitorStore()
    expect(store.monitors).toEqual([])
    expect(store.alerts).toEqual([])
    expect(store.currentMonitor).toBe(null)
    expect(store.loading).toBe(false)
    expect(store.pagination.page).toBe(1)
    expect(store.pagination.pageSize).toBe(20)
    expect(store.pagination.total).toBe(0)
  })

  describe('fetchMonitors', () => {
    it('应该获取监控项列表', async () => {
      const mockData = {
        code: 200,
        data: {
          list: [{ id: 1, monitorName: 'CPU Monitor', targetType: 'host' }],
          total: 1,
        },
      }
      ;(monitorApi.list as any).mockResolvedValue(mockData)

      const store = useMonitorStore()
      const result = await store.fetchMonitors()

      expect(monitorApi.list).toHaveBeenCalled()
      expect(store.monitors).toEqual(mockData.data.list)
      expect(store.pagination.total).toBe(1)
      expect(result).toEqual(mockData.data)
    })

    it('应该支持筛选参数', async () => {
      const mockData = { code: 200, data: { list: [], total: 0 } }
      ;(monitorApi.list as any).mockResolvedValue(mockData)

      const store = useMonitorStore()
      await store.fetchMonitors({ keyword: 'cpu', targetType: 'host', status: 1 })

      expect(monitorApi.list).toHaveBeenCalledWith(expect.objectContaining({
        keyword: 'cpu',
        targetType: 'host',
        status: 1,
      }))
    })

    it('应该处理加载状态', async () => {
      const mockData = { code: 200, data: { list: [], total: 0 } }
      ;(monitorApi.list as any).mockResolvedValue(mockData)

      const store = useMonitorStore()
      expect(store.loading).toBe(false)

      const promise = store.fetchMonitors()
      expect(store.loading).toBe(true)

      await promise
      expect(store.loading).toBe(false)
    })
  })

  describe('getMonitorById', () => {
    it('应该获取监控项详情', async () => {
      const mockMonitor = { id: 1, monitorName: 'CPU Monitor', metrics: [] }
      const mockData = { code: 200, data: mockMonitor }
      ;(monitorApi.getById as any).mockResolvedValue(mockData)

      const store = useMonitorStore()
      const result = await store.getMonitorById(1)

      expect(monitorApi.getById).toHaveBeenCalledWith(1)
      expect(store.currentMonitor).toEqual(mockMonitor)
      expect(result).toEqual(mockMonitor)
    })
  })

  describe('createMonitor', () => {
    it('应该创建监控项', async () => {
      const mockData = { code: 200, data: { id: 1 } }
      ;(monitorApi.create as any).mockResolvedValue(mockData)

      const store = useMonitorStore()
      const data = { monitorName: 'New Monitor', targetType: 'host', metricType: 'cpu' }
      const result = await store.createMonitor(data)

      expect(monitorApi.create).toHaveBeenCalledWith(data)
      expect(result).toEqual(mockData.data)
    })
  })

  describe('updateMonitor', () => {
    it('应该更新监控项', async () => {
      const mockData = { code: 200 }
      ;(monitorApi.update as any).mockResolvedValue(mockData)

      const store = useMonitorStore()
      const data = { monitorName: 'Updated Monitor' }
      await store.updateMonitor(1, data)

      expect(monitorApi.update).toHaveBeenCalledWith(1, data)
    })
  })

  describe('deleteMonitor', () => {
    it('应该删除监控项', async () => {
      const mockData = { code: 200 }
      ;(monitorApi.delete as any).mockResolvedValue(mockData)

      const store = useMonitorStore()
      await store.deleteMonitor(1)

      expect(monitorApi.delete).toHaveBeenCalledWith(1)
    })
  })

  describe('fetchAlerts', () => {
    it('应该获取告警列表', async () => {
      const mockData = {
        code: 200,
        data: {
          list: [{ id: 1, alertName: 'High CPU', alertLevel: 'warning', status: 'firing' }],
          total: 1,
        },
      }
      ;(alertApi.list as any).mockResolvedValue(mockData)

      const store = useMonitorStore()
      const result = await store.fetchAlerts()

      expect(alertApi.list).toHaveBeenCalled()
      expect(store.alerts).toEqual(mockData.data.list)
      expect(store.pagination.total).toBe(1)
      expect(result).toEqual(mockData.data)
    })
  })

  describe('分页方法', () => {
    it('setPage 应该更新页码', () => {
      const store = useMonitorStore()
      store.setPage(2)
      expect(store.pagination.page).toBe(2)
    })

    it('setPageSize 应该更新每页大小', () => {
      const store = useMonitorStore()
      store.setPageSize(50)
      expect(store.pagination.pageSize).toBe(50)
    })
  })
})