// Store单元测试 - Fault
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFaultStore } from '@/stores/fault'

// Mock API
vi.mock('@/services/api', () => ({
  faultApi: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

import { faultApi } from '@/services/api'

describe('Fault Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('State', () => {
    it('应该初始化正确的状态', () => {
      const store = useFaultStore()
      
      expect(store.faults).toEqual([])
      expect(store.currentFault).toBe(null)
      expect(store.pagination).toEqual({
        page: 1,
        pageSize: 20,
        total: 0,
      })
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchFaults', () => {
    it('应该获取故障列表', async () => {
      const mockData = {
        data: {
          list: [{ id: 1, title: 'Fault 1', level: 'high' }],
          total: 1,
        },
      }
      ;(faultApi.list as any).mockResolvedValue(mockData)
      
      const store = useFaultStore()
      const result = await store.fetchFaults()
      
      expect(faultApi.list).toHaveBeenCalled()
      expect(store.faults).toEqual(mockData.data.list)
      expect(store.pagination.total).toBe(1)
      expect(result).toEqual(mockData.data)
    })

    it('应该设置loading状态', async () => {
      ;(faultApi.list as any).mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { list: [], total: 0 } }), 10)))
      
      const store = useFaultStore()
      
      expect(store.loading).toBe(false)
      
      const promise = store.fetchFaults()
      expect(store.loading).toBe(true)
      
      await promise
      expect(store.loading).toBe(false)
    })

    it('应该支持筛选参数', async () => {
      ;(faultApi.list as any).mockResolvedValue({ data: { list: [], total: 0 } })
      
      const store = useFaultStore()
      await store.fetchFaults({ status: 'open', level: 'high' })
      
      expect(faultApi.list).toHaveBeenCalledWith({
        page: 1,
        pageSize: 20,
        status: 'open',
        level: 'high',
      })
    })
  })

  describe('getFaultById', () => {
    it('应该获取单个故障', async () => {
      const mockFault = { id: 1, title: 'Fault 1', level: 'high' }
      ;(faultApi.getById as any).mockResolvedValue({ data: mockFault })
      
      const store = useFaultStore()
      const result = await store.getFaultById(1)
      
      expect(faultApi.getById).toHaveBeenCalledWith(1)
      expect(store.currentFault).toEqual(mockFault)
      expect(result).toEqual(mockFault)
    })
  })

  describe('createFault', () => {
    it('应该创建故障', async () => {
      const newFault = { title: 'New Fault', level: 'high', type: 'server' }
      ;(faultApi.create as any).mockResolvedValue({ data: { id: 1 } })
      
      const store = useFaultStore()
      const result = await store.createFault(newFault)
      
      expect(faultApi.create).toHaveBeenCalledWith(newFault)
      expect(result).toEqual({ id: 1 })
    })
  })

  describe('updateFault', () => {
    it('应该更新故障', async () => {
      ;(faultApi.update as any).mockResolvedValue({ data: { success: true } })
      
      const store = useFaultStore()
      const result = await store.updateFault(1, { status: 'resolved' })
      
      expect(faultApi.update).toHaveBeenCalledWith(1, { status: 'resolved' })
      expect(result).toEqual({ success: true })
    })
  })

  describe('deleteFault', () => {
    it('应该删除故障', async () => {
      ;(faultApi.delete as any).mockResolvedValue({ data: { success: true } })
      
      const store = useFaultStore()
      const result = await store.deleteFault(1)
      
      expect(faultApi.delete).toHaveBeenCalledWith(1)
      expect(result).toEqual({ success: true })
    })
  })

  describe('Pagination', () => {
    it('应该设置页码', () => {
      const store = useFaultStore()
      store.setPage(2)
      expect(store.pagination.page).toBe(2)
    })

    it('应该设置每页数量', () => {
      const store = useFaultStore()
      store.setPageSize(30)
      expect(store.pagination.pageSize).toBe(30)
    })
  })
})